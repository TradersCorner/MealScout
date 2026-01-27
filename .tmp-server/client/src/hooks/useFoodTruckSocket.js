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
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth.js';
import { io } from 'socket.io-client';
import { API_BASE_URL } from "@/lib/api";
var ENABLE_SOCKETS = import.meta.env.VITE_ENABLE_SOCKETS === "true";
export function useFoodTruckSocket(_a) {
    var _b = _a === void 0 ? {} : _a, onLocationUpdate = _b.onLocationUpdate, onStatusUpdate = _b.onStatusUpdate, _c = _b.autoConnect, autoConnect = _c === void 0 ? true : _c;
    var user = useAuth().user;
    var _d = useState(false), isConnected = _d[0], setIsConnected = _d[1];
    var _e = useState(null), connectionError = _e[0], setConnectionError = _e[1];
    var _f = useState(0), reconnectAttempts = _f[0], setReconnectAttempts = _f[1];
    var socketRef = useRef(null);
    var reconnectTimeoutRef = useRef();
    var subscriptionQueueRef = useRef([]);
    var maxReconnectAttempts = 10; // Increased for free tier wake-up
    var baseReconnectDelay = 3000; // 3 seconds to allow backend spin-up
    var connect = useCallback(function () {
        var _a;
        if (!ENABLE_SOCKETS) {
            return;
        }
        if ((_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connected)
            return;
        try {
            // Create Socket.IO connection via same-origin proxy (no explicit URL)
            // Allow polling first for dev compatibility, then upgrade to websocket
            var socketUrl = import.meta.env.DEV ? undefined : (API_BASE_URL || undefined);
            var socket_1 = io(socketUrl, {
                autoConnect: true,
                transports: ['polling', 'websocket'],
                withCredentials: true,
                path: '/socket.io',
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 3000,
                reconnectionDelayMax: 10000,
                timeout: 20000 // Allow time for Render free tier to wake up
            });
            socketRef.current = socket_1;
            socket_1.on('connect', function () {
                console.log('Food truck Socket.IO connected');
                setIsConnected(true);
                setConnectionError(null);
                setReconnectAttempts(0);
                // Send authentication if user is logged in - Socket.IO style
                if (user && user.id) {
                    socket_1.emit('auth', { userId: user.id });
                }
                // Process queued subscriptions now that connection is established
                if (subscriptionQueueRef.current.length > 0) {
                    console.log('Processing queued subscriptions:', subscriptionQueueRef.current.length);
                    subscriptionQueueRef.current.forEach(function (channel) {
                        // Parse the channel to extract subscription data
                        if (channel.startsWith('nearby:')) {
                            var parts = channel.split(':');
                            var latitude = parseFloat(parts[1]);
                            var longitude = parseFloat(parts[2]);
                            var radiusKm = parseInt(parts[3]) / 1000; // Convert meters to km
                            socket_1.emit('subscribe_nearby', { latitude: latitude, longitude: longitude, radiusKm: radiusKm });
                        }
                        else if (channel.startsWith('restaurant:')) {
                            var restaurantId = channel.split(':')[1];
                            socket_1.emit('subscribe_restaurant', { restaurantId: restaurantId });
                        }
                    });
                    subscriptionQueueRef.current = []; // Clear the queue
                }
            });
            // Handle location updates
            socket_1.on('location_update', function (data) {
                var _a, _b, _c;
                var locData = data.location || {};
                var toNumber = function (v) {
                    if (typeof v === 'number')
                        return v;
                    if (typeof v === 'string') {
                        var n = Number(v);
                        return Number.isNaN(n) ? undefined : n;
                    }
                    return undefined;
                };
                var mapped = {
                    restaurantId: data.restaurantId,
                    latitude: (_a = toNumber(locData.latitude)) !== null && _a !== void 0 ? _a : 0,
                    longitude: (_b = toNumber(locData.longitude)) !== null && _b !== void 0 ? _b : 0,
                    heading: toNumber(locData.heading),
                    speed: toNumber(locData.speed),
                    accuracy: toNumber(locData.accuracy),
                    timestamp: data.timestamp,
                    sessionId: (_c = locData.sessionId) !== null && _c !== void 0 ? _c : ''
                };
                onLocationUpdate === null || onLocationUpdate === void 0 ? void 0 : onLocationUpdate(mapped);
            });
            // Handle status updates
            socket_1.on('status_update', function (data) {
                var _a;
                var mapped = {
                    restaurantId: data.restaurantId,
                    isOnline: !!((_a = data.status) === null || _a === void 0 ? void 0 : _a.isOnline),
                    lastSeen: new Date().toISOString(),
                    sessionId: undefined,
                };
                onStatusUpdate === null || onStatusUpdate === void 0 ? void 0 : onStatusUpdate(mapped);
            });
            // Handle nearby trucks data
            socket_1.on('nearby_trucks', function (data) {
                var _a;
                console.log('Received nearby trucks:', ((_a = data.trucks) === null || _a === void 0 ? void 0 : _a.length) || 0);
                // This can be handled by parent components if needed
            });
            // Handle errors
            socket_1.on('error', function (error) {
                console.error('Socket.IO server error:', error.message || error);
                setConnectionError(error.message || 'Server error');
            });
            socket_1.on('disconnect', function (reason) {
                console.log('Food truck Socket.IO disconnected:', reason);
                setIsConnected(false);
                socketRef.current = null;
                // Socket.IO handles reconnection automatically, but we track attempts
                if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                    // Intentional disconnect - don't reconnect
                    return;
                }
                // For other disconnects, Socket.IO will auto-reconnect, so we just track state
                if (reconnectAttempts < maxReconnectAttempts && autoConnect) {
                    setReconnectAttempts(function (prev) { return prev + 1; });
                    console.log("Socket.IO will attempt auto-reconnect (attempt ".concat(reconnectAttempts + 1, "/").concat(maxReconnectAttempts, ")"));
                }
                else if (reconnectAttempts >= maxReconnectAttempts) {
                    console.log('Max reconnection attempts reached. Food truck updates disabled.');
                    setConnectionError('Connection failed after multiple attempts');
                }
            });
            socket_1.on('connect_error', function (error) {
                console.error('Socket.IO connection error:', error);
                setConnectionError('Socket connection failed');
            });
        }
        catch (error) {
            console.error('Failed to create Socket.IO connection:', error);
            setConnectionError('Failed to establish connection');
        }
    }, [user, onLocationUpdate, onStatusUpdate, autoConnect, reconnectAttempts]);
    var disconnect = useCallback(function () {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setIsConnected(false);
        setConnectionError(null);
        setReconnectAttempts(0);
    }, []);
    var subscribeToNearby = useCallback(function (latitude, longitude, radiusKm) {
        var _a;
        if (radiusKm === void 0) { radiusKm = 5000; }
        if ((_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connected) {
            console.log('Subscribing to nearby trucks:', { latitude: latitude, longitude: longitude, radiusKm: radiusKm / 1000 });
            socketRef.current.emit('subscribe_nearby', { latitude: latitude, longitude: longitude, radiusKm: radiusKm / 1000 });
        }
        else {
            // Queue subscription for when connection is established  
            var channel = "nearby:".concat(latitude.toFixed(4), ":").concat(longitude.toFixed(4), ":").concat(radiusKm);
            console.log('Queueing subscription for nearby trucks:', channel);
            subscriptionQueueRef.current = [channel];
        }
    }, []);
    var subscribeToRestaurant = useCallback(function (restaurantId) {
        var _a;
        if ((_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connected) {
            console.log('Subscribing to restaurant updates:', restaurantId);
            socketRef.current.emit('subscribe_restaurant', { restaurantId: restaurantId });
        }
        else {
            // Queue subscription for when connection is established
            subscriptionQueueRef.current.push("restaurant:".concat(restaurantId));
        }
    }, []);
    // Auto-connect on mount if enabled
    useEffect(function () {
        if (autoConnect && ENABLE_SOCKETS) {
            connect();
        }
    }, [connect, autoConnect]);
    // Cleanup on unmount
    useEffect(function () {
        return function () {
            disconnect();
        };
    }, [disconnect]);
    return {
        isConnected: isConnected,
        connectionError: connectionError,
        connect: connect,
        disconnect: disconnect,
        subscribeToNearby: subscribeToNearby,
        subscribeToRestaurant: subscribeToRestaurant,
        reconnectAttempts: reconnectAttempts,
        socket: socketRef.current
    };
}
// Legacy hook name for backward compatibility
export var useFoodTruckWebSocket = useFoodTruckSocket;
// Fallback polling hook for when WebSocket is not available
export function useFoodTruckPolling(interval) {
    var _this = this;
    if (interval === void 0) { interval = 30000; }
    var _a = useState([]), foodTrucks = _a[0], setFoodTrucks = _a[1];
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var fetchFoodTrucks = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setIsLoading(true);
                    return [4 /*yield*/, fetch(API_BASE_URL ? "".concat(API_BASE_URL, "/api/trucks/live") : '/api/trucks/live', {
                            credentials: 'include',
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to fetch food trucks');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setFoodTrucks(data.trucks || []);
                    setError(null);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    useEffect(function () {
        fetchFoodTrucks(); // Initial fetch
        var intervalId = setInterval(fetchFoodTrucks, interval);
        return function () { return clearInterval(intervalId); };
    }, [fetchFoodTrucks, interval]);
    return {
        foodTrucks: foodTrucks,
        isLoading: isLoading,
        error: error,
        refetch: fetchFoodTrucks
    };
}

