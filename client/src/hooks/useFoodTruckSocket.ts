import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface FoodTruckLocation {
  restaurantId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
  sessionId: string;
}

interface FoodTruckStatus {
  restaurantId: string;
  isOnline: boolean;
  lastSeen: string;
  sessionId?: string;
}

interface UseFoodTruckSocketProps {
  onLocationUpdate?: (location: FoodTruckLocation) => void;
  onStatusUpdate?: (status: FoodTruckStatus) => void;
  autoConnect?: boolean;
}

export function useFoodTruckSocket({
  onLocationUpdate,
  onStatusUpdate,
  autoConnect = true
}: UseFoodTruckSocketProps = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Create WebSocket connection to the backend server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/food-trucks`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Food truck WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);

        // Send authentication if user is logged in
        if (user && user.id) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        }

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'location_update':
              onLocationUpdate?.(data.location);
              break;
            case 'status_update':
              onStatusUpdate?.(data.status);
              break;
            case 'pong':
              // Connection is alive
              break;
            case 'error':
              console.error('WebSocket server error:', data.message);
              setConnectionError(data.message);
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Food truck WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = undefined;
        }

        // Only attempt to reconnect if explicitly requested (disabled for now to prevent spam)
        if (false && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts && autoConnect) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          setReconnectAttempts(prev => prev + 1);
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.log('WebSocket connection failed. Food truck updates disabled.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection failed');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [user, onLocationUpdate, onStatusUpdate, autoConnect, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    setReconnectAttempts(0);
  }, []);

  const subscribeTo = useCallback((channels: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        channels
      }));
    }
  }, []);

  const unsubscribeFrom = useCallback((channels: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        channels
      }));
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    subscribeTo,
    unsubscribeFrom,
    // Helper to subscribe to nearby food trucks
    subscribeToNearby: (latitude: number, longitude: number, radius: number = 5000) => {
      subscribeTo([`nearby:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radius}`]);
    },
    // Helper to subscribe to specific restaurant
    subscribeToRestaurant: (restaurantId: string) => {
      subscribeTo([`restaurant:${restaurantId}`]);
    }
  };
}

// Fallback polling hook for when WebSocket is not available
export function useFoodTruckPolling({
  onLocationUpdate,
  onStatusUpdate,
  interval = 10000, // 10 seconds
  enabled = false
}: {
  onLocationUpdate?: (locations: FoodTruckLocation[]) => void;
  onStatusUpdate?: (statuses: FoodTruckStatus[]) => void;
  interval?: number;
  enabled?: boolean;
}) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const startPolling = useCallback(async () => {
    if (!enabled || isPolling) return;

    setIsPolling(true);

    const poll = async () => {
      try {
        // Fetch current food truck locations
        const response = await fetch('/api/food-trucks/active');
        if (response.ok) {
          const data = await response.json();
          onLocationUpdate?.(data.locations || []);
          onStatusUpdate?.(data.statuses || []);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [enabled, isPolling, interval, onLocationUpdate, onStatusUpdate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    isPolling,
    startPolling,
    stopPolling
  };
}