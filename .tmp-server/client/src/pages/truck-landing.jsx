var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import RoleLandingPage from "@/components/role-landing";
import { roleLandingContent } from "@/content/role-landing";
var hostIcon = new L.Icon({
    iconUrl: "data:image/svg+xml;base64," +
        btoa("\n      <svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n        <circle cx=\"14\" cy=\"14\" r=\"12\" fill=\"#F97316\" stroke=\"white\" stroke-width=\"3\"/>\n        <path d=\"M14 7l5 4v8h-3v-4h-4v4H9v-8l5-4z\" fill=\"white\"/>\n      </svg>\n    "),
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -22],
});
export default function TruckLanding() {
    var _this = this;
    var _a = useState([]), hostPins = _a[0], setHostPins = _a[1];
    var _b = useState(false), mapError = _b[0], setMapError = _b[1];
    useEffect(function () {
        var cancelled = false;
        var fetchPins = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, pins, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/map/locations")];
                    case 1:
                        res = _b.sent();
                        if (!res.ok)
                            throw new Error("Map locations unavailable");
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _b.sent();
                        if (cancelled)
                            return [2 /*return*/];
                        pins = ((data === null || data === void 0 ? void 0 : data.hostLocations) || [])
                            .map(function (host) { return (__assign(__assign({}, host), { latitude: host.latitude !== null ? Number(host.latitude) : host.latitude, longitude: host.longitude !== null
                                ? Number(host.longitude)
                                : host.longitude })); })
                            .filter(function (host) {
                            return typeof host.latitude === "number" &&
                                typeof host.longitude === "number";
                        });
                        setHostPins(pins);
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        if (!cancelled) {
                            setMapError(true);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchPins();
        return function () {
            cancelled = true;
        };
    }, []);
    var mapCenter = useMemo(function () {
        if (!hostPins.length) {
            return { lat: 30.4213, lng: -87.2169 };
        }
        var latSum = hostPins.reduce(function (sum, host) { return sum + Number(host.latitude || 0); }, 0);
        var lngSum = hostPins.reduce(function (sum, host) { return sum + Number(host.longitude || 0); }, 0);
        return {
            lat: latSum / hostPins.length,
            lng: lngSum / hostPins.length,
        };
    }, [hostPins]);
    var showLiveMap = hostPins.length > 0 && !mapError;
    var content = __assign(__assign({}, roleLandingContent.truck), { map: __assign(__assign({}, roleLandingContent.truck.map), { badge: showLiveMap ? "Live view" : roleLandingContent.truck.map.badge }) });
    return (<RoleLandingPage content={content} mapSlot={showLiveMap ? (<MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {hostPins.map(function (host) { return (<Marker key={host.id} position={[Number(host.latitude), Number(host.longitude)]} icon={hostIcon}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{host.name}</div>
                    <div className="text-xs text-slate-600">{host.address}</div>
                  </div>
                </Popup>
              </Marker>); })}
          </MapContainer>) : undefined}/>);
}
