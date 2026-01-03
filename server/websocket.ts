import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { incConnect, incDisconnect, incSubscribeNearby, maybeWarnIfChurn } from "./utils/realtimeMetrics";

const PgSession = connectPg(session);

// Interface for authenticated socket
interface AuthenticatedSocket {
  id: string;
  user?: any;
  userId?: string | null;
  sessionID?: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}

// Global WebSocket server instance
let io: SocketIOServer | null = null;

// Store user subscriptions for cleanup
const userSubscriptions = new Map<string, Set<string>>();

export function setupWebSocketServer(httpServer: Server): SocketIOServer {
  // Session middleware configuration (same as Express app)
  const sessionMiddleware = session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });

  // Create Socket.IO server with restricted CORS
  const defaultOrigins = 'http://localhost:5000,http://localhost:5173,http://127.0.0.1:5173,https://meal-scout.vercel.app,https://mealscout.us,https://www.mealscout.us';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins).split(',').map(o => o.trim());
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  // Auth middleware for Socket.IO using Express session
  io.use((socket: any, next) => {
    sessionMiddleware(socket.request as any, {} as any, () => {
      const session = (socket.request as any).session;
      const user = session?.passport?.user;
      
      if (user) {
        // Authenticated user
        socket.userId = user;
        socket.sessionID = (socket.request as any).sessionID;
      } else {
        // Anonymous user (allowed for viewing trucks)
        socket.userId = null;
        socket.sessionID = (socket.request as any).sessionID || `anon_${Date.now()}_${Math.random()}`;
      }
      
      next();
    });
  });

  // Connection handling
  io.on("connection", async (socket: AuthenticatedSocket) => {
    incConnect();
    console.log(`WebSocket connected: ${socket.id}, userId: ${socket.userId || 'anonymous'}`);

    try {
      // Load user data if authenticated
      if (socket.userId) {
        socket.user = await storage.getUser(socket.userId);
      }

      // Initialize user subscriptions tracking
      const userKey = socket.userId || socket.sessionID || `fallback_${socket.id}`;
      if (!userSubscriptions.has(userKey)) {
        userSubscriptions.set(userKey, new Set());
      }

      // Handle subscription to nearby trucks by location
      socket.on("subscribe_nearby", async (data: { latitude: number; longitude: number; radiusKm?: number }) => {
        try {
          incSubscribeNearby();
          const { latitude, longitude, radiusKm = 5 } = data;
          
          // Validate coordinates
          if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
              latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            socket.emit("error", { message: "Invalid coordinates" });
            return;
          }

          // Create geographic room key (grid-based approach for efficiency)
          const gridSize = 0.1; // ~11km grid squares
          const gridLat = Math.floor(latitude / gridSize) * gridSize;
          const gridLng = Math.floor(longitude / gridSize) * gridSize;
          const roomKey = `grid_${gridLat}_${gridLng}`;
          
          // Leave previous geographic rooms
          const userSubs = userSubscriptions.get(userKey);
          if (userSubs) {
            userSubs.forEach(room => {
              if (room.startsWith('grid_')) {
                socket.leave(room);
                userSubs.delete(room);
              }
            });
          }

          // Join new geographic room
          socket.join(roomKey);
          userSubs?.add(roomKey);

          // Send initial nearby trucks data
          const nearbyTrucks = await storage.getLiveTrucksNearby(latitude, longitude, radiusKm);
          socket.emit("nearby_trucks", { trucks: nearbyTrucks });
          
          console.log(`User ${userKey} subscribed to nearby trucks in ${roomKey}`);
        } catch (error) {
          console.error("Error handling nearby subscription:", error);
          socket.emit("error", { message: "Failed to subscribe to nearby trucks" });
        }
      });

      // Handle subscription to specific restaurant updates (for owners)
      socket.on("subscribe_restaurant", async (data: { restaurantId: string }) => {
        try {
          const { restaurantId } = data;
          
          if (!socket.user) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          // Verify user owns this restaurant
          const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, socket.user.id);
          if (!isAuthorized) {
            socket.emit("error", { message: "Unauthorized: You can only subscribe to restaurants you own" });
            return;
          }

          const roomKey = `restaurant_${restaurantId}`;
          socket.join(roomKey);
          userSubscriptions.get(userKey)?.add(roomKey);
          
          socket.emit("subscribed", { restaurantId, room: roomKey });
          console.log(`User ${userKey} subscribed to restaurant ${restaurantId}`);
        } catch (error) {
          console.error("Error handling restaurant subscription:", error);
          socket.emit("error", { message: "Failed to subscribe to restaurant" });
        }
      });

      // Handle unsubscribe
      socket.on("unsubscribe", (data: { room?: string }) => {
        try {
          const userSubs = userSubscriptions.get(userKey);
          if (data.room && userSubs?.has(data.room)) {
            socket.leave(data.room);
            userSubs.delete(data.room);
            socket.emit("unsubscribed", { room: data.room });
          }
        } catch (error) {
          console.error("Error handling unsubscribe:", error);
          socket.emit("error", { message: "Failed to unsubscribe" });
        }
      });

      // Handle ping for connection keepalive
      socket.on("ping", () => {
        try {
          socket.emit("pong", {});
        } catch (error) {
          console.error("Error handling ping:", error);
        }
      });

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        console.log(`WebSocket disconnected: ${socket.id}, reason: ${reason}`);
        incDisconnect();
        maybeWarnIfChurn((msg) => console.warn(msg));
        
        // Clean up user subscriptions
        userSubscriptions.delete(userKey);
      });

    } catch (error) {
      console.error("Error setting up WebSocket connection:", error);
      socket.disconnect();
    }
  });

  console.log("Socket.IO server setup complete at default path");
  return io;
}

// Broadcast location update to subscribers
export function broadcastLocationUpdate(restaurantId: string, locationData: any) {
  if (!io) {
    console.warn("WebSocket server not initialized");
    return;
  }

  try {
    // Broadcast to restaurant-specific room (for owners)
    const restaurantRoom = `restaurant_${restaurantId}`;
    io.to(restaurantRoom).emit("location_update", {
      type: "location_update",
      restaurantId,
      location: locationData,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to geographic grid rooms (for nearby customers)
    if (locationData.latitude && locationData.longitude) {
      const gridSize = 0.1;
      const gridLat = Math.floor(locationData.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(locationData.longitude / gridSize) * gridSize;
      
      // Broadcast to current grid and adjacent grids for seamless coverage
      for (let latOffset = -1; latOffset <= 1; latOffset++) {
        for (let lngOffset = -1; lngOffset <= 1; lngOffset++) {
          const targetGridLat = gridLat + (latOffset * gridSize);
          const targetGridLng = gridLng + (lngOffset * gridSize);
          const gridRoom = `grid_${targetGridLat}_${targetGridLng}`;
          
          io.to(gridRoom).emit("truck_location_update", {
            type: "truck_location_update",
            restaurantId,
            location: locationData,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`Broadcasted location update for restaurant ${restaurantId}`);
  } catch (error) {
    console.error("Error broadcasting location update:", error);
  }
}

// Broadcast status update (online/offline)
export function broadcastStatusUpdate(restaurantId: string, status: { isOnline: boolean; mobileOnline?: boolean }) {
  if (!io) {
    console.warn("WebSocket server not initialized");
    return;
  }

  try {
    // Broadcast to restaurant-specific room
    const restaurantRoom = `restaurant_${restaurantId}`;
    io.to(restaurantRoom).emit("status_update", {
      type: "status_update", 
      restaurantId,
      status,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to all geographic rooms if going offline
    if (!status.isOnline) {
      io.emit("truck_status_update", {
        type: "truck_status_update",
        restaurantId,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Broadcasted status update for restaurant ${restaurantId}:`, status);
  } catch (error) {
    console.error("Error broadcasting status update:", error);
  }
}

// Get WebSocket server instance
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

// Get connection stats for monitoring
export function getConnectionStats() {
  if (!io) return { totalConnections: 0, rooms: [] };

  const sockets = io.sockets.sockets;
  const rooms = Array.from(io.sockets.adapter.rooms.keys()).filter(room => 
    !sockets.has(room) // Filter out socket IDs (which are also stored as rooms)
  );

  return {
    totalConnections: sockets.size,
    rooms: rooms,
    userSubscriptions: userSubscriptions.size,
  };
}