var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage.js";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { incConnect, incDisconnect, incSubscribeNearby, maybeWarnIfChurn } from "./utils/realtimeMetrics.js";
var PgSession = connectPg(session);
// Global WebSocket server instance
var io = null;
// Store user subscriptions for cleanup
var userSubscriptions = new Map();
export function setupWebSocketServer(httpServer) {
    var _this = this;
    // Session middleware configuration (same as Express app)
    var sessionMiddleware = session({
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
    var defaultOrigins = 'http://localhost:5000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://meal-scout.vercel.app,https://mealscout.us,https://www.mealscout.us,https://mealscout.onrender.com';
    var allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins).split(',').map(function (o) { return o.trim(); });
    io = new SocketIOServer(httpServer, {
        path: "/socket.io",
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["polling", "websocket"],
    });
    // Connection handling - no auth middleware (TradeScout Law: read-only realtime discovery allowed)
    io.on("connection", function (socket) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            incConnect();
            socket.userId = null;
            socket.sessionID = undefined;
            socket.user = null;
            // Extract session data if available (non-blocking, best-effort)
            sessionMiddleware(socket.request, {}, function () { return __awaiter(_this, void 0, void 0, function () {
                var session, user, _a, userKey;
                var _this = this;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            session = socket.request.session;
                            user = (_b = session === null || session === void 0 ? void 0 : session.passport) === null || _b === void 0 ? void 0 : _b.user;
                            if (!user) return [3 /*break*/, 2];
                            socket.userId = user;
                            socket.sessionID = socket.request.sessionID;
                            _a = socket;
                            return [4 /*yield*/, storage.getUser(socket.userId)];
                        case 1:
                            _a.user = _c.sent();
                            console.log("WebSocket connected: ".concat(socket.id, ", userId: ").concat(socket.userId));
                            return [3 /*break*/, 3];
                        case 2:
                            socket.userId = null;
                            socket.sessionID = "anon_".concat(Date.now(), "_").concat(Math.random());
                            console.log("WebSocket connected: ".concat(socket.id, " (anonymous)"));
                            _c.label = 3;
                        case 3:
                            userKey = socket.userId || socket.sessionID || "fallback_".concat(socket.id);
                            if (!userSubscriptions.has(userKey)) {
                                userSubscriptions.set(userKey, new Set());
                            }
                            // Handle subscription to nearby trucks by location
                            socket.on("subscribe_nearby", function (data) { return __awaiter(_this, void 0, void 0, function () {
                                var latitude, longitude, _a, radiusKm, gridSize, gridLat, gridLng, roomKey, userSubs_1, nearbyTrucks, error_1;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            incSubscribeNearby();
                                            latitude = data.latitude, longitude = data.longitude, _a = data.radiusKm, radiusKm = _a === void 0 ? 5 : _a;
                                            // Validate coordinates
                                            if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
                                                latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                                                socket.emit("error", { message: "Invalid coordinates" });
                                                return [2 /*return*/];
                                            }
                                            gridSize = 0.1;
                                            gridLat = Math.floor(latitude / gridSize) * gridSize;
                                            gridLng = Math.floor(longitude / gridSize) * gridSize;
                                            roomKey = "grid_".concat(gridLat, "_").concat(gridLng);
                                            userSubs_1 = userSubscriptions.get(userKey);
                                            if (userSubs_1) {
                                                userSubs_1.forEach(function (room) {
                                                    if (room.startsWith('grid_')) {
                                                        socket.leave(room);
                                                        userSubs_1.delete(room);
                                                    }
                                                });
                                            }
                                            // Join new geographic room
                                            socket.join(roomKey);
                                            userSubs_1 === null || userSubs_1 === void 0 ? void 0 : userSubs_1.add(roomKey);
                                            return [4 /*yield*/, storage.getLiveTrucksNearby(latitude, longitude, radiusKm)];
                                        case 1:
                                            nearbyTrucks = _b.sent();
                                            socket.emit("nearby_trucks", { trucks: nearbyTrucks });
                                            console.log("User ".concat(userKey, " subscribed to nearby trucks in ").concat(roomKey));
                                            return [3 /*break*/, 3];
                                        case 2:
                                            error_1 = _b.sent();
                                            console.error("Error handling nearby subscription:", error_1);
                                            socket.emit("error", { message: "Failed to subscribe to nearby trucks" });
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); });
                            // Handle subscription to specific restaurant updates (for owners)
                            socket.on("subscribe_restaurant", function (data) { return __awaiter(_this, void 0, void 0, function () {
                                var restaurantId, isAuthorized, roomKey, error_2;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            restaurantId = data.restaurantId;
                                            if (!socket.user) {
                                                socket.emit("error", { message: "Authentication required" });
                                                return [2 /*return*/];
                                            }
                                            return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, socket.user.id)];
                                        case 1:
                                            isAuthorized = _b.sent();
                                            if (!isAuthorized) {
                                                socket.emit("error", { message: "Unauthorized: You can only subscribe to restaurants you own" });
                                                return [2 /*return*/];
                                            }
                                            roomKey = "restaurant_".concat(restaurantId);
                                            socket.join(roomKey);
                                            (_a = userSubscriptions.get(userKey)) === null || _a === void 0 ? void 0 : _a.add(roomKey);
                                            socket.emit("subscribed", { restaurantId: restaurantId, room: roomKey });
                                            console.log("User ".concat(userKey, " subscribed to restaurant ").concat(restaurantId));
                                            return [3 /*break*/, 3];
                                        case 2:
                                            error_2 = _b.sent();
                                            console.error("Error handling restaurant subscription:", error_2);
                                            socket.emit("error", { message: "Failed to subscribe to restaurant" });
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); });
                            // Handle unsubscribe
                            socket.on("unsubscribe", function (data) {
                                try {
                                    var userSubs = userSubscriptions.get(userKey);
                                    if (data.room && (userSubs === null || userSubs === void 0 ? void 0 : userSubs.has(data.room))) {
                                        socket.leave(data.room);
                                        userSubs.delete(data.room);
                                        socket.emit("unsubscribed", { room: data.room });
                                    }
                                }
                                catch (error) {
                                    console.error("Error handling unsubscribe:", error);
                                    socket.emit("error", { message: "Failed to unsubscribe" });
                                }
                            });
                            // Handle ping for connection keepalive
                            socket.on("ping", function () {
                                try {
                                    socket.emit("pong", {});
                                }
                                catch (error) {
                                    console.error("Error handling ping:", error);
                                }
                            });
                            // Handle disconnect
                            socket.on("disconnect", function (reason) {
                                console.log("WebSocket disconnected: ".concat(socket.id, ", reason: ").concat(reason));
                                incDisconnect();
                                maybeWarnIfChurn(function (msg) { return console.warn(msg); });
                                // Clean up user subscriptions
                                userSubscriptions.delete(userKey);
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); });
    console.log("Socket.IO server setup complete at default path");
    return io;
}
// Broadcast location update to subscribers
export function broadcastLocationUpdate(restaurantId, locationData) {
    if (!io) {
        console.warn("WebSocket server not initialized");
        return;
    }
    try {
        // Broadcast to restaurant-specific room (for owners)
        var restaurantRoom = "restaurant_".concat(restaurantId);
        io.to(restaurantRoom).emit("location_update", {
            type: "location_update",
            restaurantId: restaurantId,
            location: locationData,
            timestamp: new Date().toISOString(),
        });
        // Broadcast to geographic grid rooms (for nearby customers)
        if (locationData.latitude && locationData.longitude) {
            var gridSize = 0.1;
            var latNum = typeof locationData.latitude === 'string' ? Number(locationData.latitude) : locationData.latitude;
            var lngNum = typeof locationData.longitude === 'string' ? Number(locationData.longitude) : locationData.longitude;
            if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
                console.warn("Skipping broadcast: invalid coordinates", locationData);
                return;
            }
            var gridLat = Math.floor(latNum / gridSize) * gridSize;
            var gridLng = Math.floor(lngNum / gridSize) * gridSize;
            // Broadcast to current grid and adjacent grids for seamless coverage
            for (var latOffset = -1; latOffset <= 1; latOffset++) {
                for (var lngOffset = -1; lngOffset <= 1; lngOffset++) {
                    var targetGridLat = gridLat + (latOffset * gridSize);
                    var targetGridLng = gridLng + (lngOffset * gridSize);
                    var gridRoom = "grid_".concat(targetGridLat, "_").concat(targetGridLng);
                    io.to(gridRoom).emit("truck_location_update", {
                        type: "truck_location_update",
                        restaurantId: restaurantId,
                        location: locationData,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }
        console.log("Broadcasted location update for restaurant ".concat(restaurantId));
    }
    catch (error) {
        console.error("Error broadcasting location update:", error);
    }
}
// Broadcast status update (online/offline)
export function broadcastStatusUpdate(restaurantId, status) {
    if (!io) {
        console.warn("WebSocket server not initialized");
        return;
    }
    try {
        // Broadcast to restaurant-specific room
        var restaurantRoom = "restaurant_".concat(restaurantId);
        io.to(restaurantRoom).emit("status_update", {
            type: "status_update",
            restaurantId: restaurantId,
            status: status,
            timestamp: new Date().toISOString(),
        });
        // Also broadcast to all geographic rooms if going offline
        if (!status.isOnline) {
            io.emit("truck_status_update", {
                type: "truck_status_update",
                restaurantId: restaurantId,
                status: status,
                timestamp: new Date().toISOString(),
            });
        }
        console.log("Broadcasted status update for restaurant ".concat(restaurantId, ":"), status);
    }
    catch (error) {
        console.error("Error broadcasting status update:", error);
    }
}
// Get WebSocket server instance
export function getWebSocketServer() {
    return io;
}
// Get connection stats for monitoring
export function getConnectionStats() {
    if (!io)
        return { totalConnections: 0, rooms: [] };
    var sockets = io.sockets.sockets;
    var rooms = Array.from(io.sockets.adapter.rooms.keys()).filter(function (room) {
        return !sockets.has(room);
    } // Filter out socket IDs (which are also stored as rooms)
    );
    return {
        totalConnections: sockets.size,
        rooms: rooms,
        userSubscriptions: userSubscriptions.size,
    };
}

