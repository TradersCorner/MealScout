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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, Marker, TileLayer, Circle, useMap, useMapEvents, } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Target } from "lucide-react";
import Navigation from "@/components/navigation";
var defaultCenter = { lat: 39.8283, lng: -98.5795 };
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
});
var emptyForm = {
    name: "",
    status: "draft",
    placements: ["map", "home", "deals"],
    title: "",
    body: "",
    mediaUrl: "",
    targetUrl: "",
    ctaText: "Learn more",
    geofenceLat: defaultCenter.lat,
    geofenceLng: defaultCenter.lng,
    geofenceRadiusM: 1500,
    targetUserTypes: [],
    minDailyFootTraffic: "",
    maxDailyFootTraffic: "",
    priority: 0,
    startAt: "",
    endAt: "",
};
var placementOptions = [
    "map",
    "home",
    "deals",
];
var userTypeOptions = [
    "guest",
    "customer",
    "food_truck",
    "restaurant_owner",
    "host",
    "event_coordinator",
    "staff",
    "admin",
    "super_admin",
];
function GeoAdMap(_a) {
    var center = _a.center, radius = _a.radius, onCenterChange = _a.onCenterChange;
    function MapCenterer() {
        var map = useMap();
        useEffect(function () {
            if (!map)
                return;
            map.setView([center.lat, center.lng]);
        }, [map, center.lat, center.lng]);
        return null;
    }
    function MapClickHandler() {
        useMapEvents({
            click: function (event) { return onCenterChange(event.latlng.lat, event.latlng.lng); },
        });
        return null;
    }
    return (<MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: "100%", width: "100%" }} className="rounded-xl overflow-hidden">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
      <MapCenterer />
      <MapClickHandler />
      <Marker position={[center.lat, center.lng]} draggable eventHandlers={{
            dragend: function (event) {
                var marker = event.target;
                var _a = marker.getLatLng(), lat = _a.lat, lng = _a.lng;
                onCenterChange(lat, lng);
            },
        }}/>
      <Circle center={[center.lat, center.lng]} radius={radius}/>
    </MapContainer>);
}
export default function AdminGeoAds() {
    var _this = this;
    var _a, _b, _c;
    var queryClient = useQueryClient();
    var _d = useState(emptyForm), form = _d[0], setForm = _d[1];
    var _e = useState(null), editingId = _e[0], setEditingId = _e[1];
    var _f = useQuery({
        queryKey: ["/api/admin/geo-ads"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/geo-ads", {
                            credentials: "include",
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to fetch geo ads");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }), _g = _f.data, ads = _g === void 0 ? [] : _g, isLoading = _f.isLoading;
    var metrics = useQuery({
        queryKey: editingId ? ["/api/admin/geo-ads", editingId, "metrics"] : [],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/geo-ads/".concat(editingId, "/metrics"), {
                            credentials: "include",
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to fetch metrics");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        enabled: Boolean(editingId),
    }).data;
    var createAd = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/geo-ads", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(payload),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error(text || "Failed to create ad");
                    case 3: return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/geo-ads"] });
            setForm(emptyForm);
            setEditingId(null);
        },
    });
    var updateAd = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/geo-ads/".concat(editingId), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(payload),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error(text || "Failed to update ad");
                    case 3: return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/geo-ads"] });
        },
    });
    var archiveAd = useMutation({
        mutationFn: function (id) { return __awaiter(_this, void 0, void 0, function () {
            var res, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/geo-ads/".concat(id), {
                            method: "DELETE",
                            credentials: "include",
                        })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error(text || "Failed to archive ad");
                    case 3: return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/geo-ads"] });
            if (editingId) {
                setEditingId(null);
                setForm(emptyForm);
            }
        },
    });
    var mapCenter = useMemo(function () {
        var lat = Number.isFinite(form.geofenceLat) && form.geofenceLat !== 0
            ? form.geofenceLat
            : defaultCenter.lat;
        var lng = Number.isFinite(form.geofenceLng) && form.geofenceLng !== 0
            ? form.geofenceLng
            : defaultCenter.lng;
        return { lat: lat, lng: lng };
    }, [form.geofenceLat, form.geofenceLng]);
    var handleSubmit = function () {
        var payload = __assign(__assign({}, form), { mediaUrl: form.mediaUrl.trim() || null, body: form.body.trim() || null, ctaText: form.ctaText.trim() || "Learn more", minDailyFootTraffic: form.minDailyFootTraffic === "" ? null : form.minDailyFootTraffic, maxDailyFootTraffic: form.maxDailyFootTraffic === "" ? null : form.maxDailyFootTraffic, targetUserTypes: form.targetUserTypes, startAt: form.startAt || null, endAt: form.endAt || null });
        if (editingId) {
            updateAd.mutate(payload);
        }
        else {
            createAd.mutate(payload);
        }
    };
    var selectAd = function (ad) {
        var _a, _b, _c;
        setEditingId(ad.id);
        setForm({
            name: ad.name || "",
            status: ad.status || "draft",
            placements: Array.isArray(ad.placements)
                ? ad.placements
                : [],
            title: ad.title || "",
            body: ad.body || "",
            mediaUrl: ad.mediaUrl || "",
            targetUrl: ad.targetUrl || "",
            ctaText: ad.ctaText || "Learn more",
            geofenceLat: Number(ad.geofenceLat) || defaultCenter.lat,
            geofenceLng: Number(ad.geofenceLng) || defaultCenter.lng,
            geofenceRadiusM: Number(ad.geofenceRadiusM) || 1500,
            targetUserTypes: Array.isArray(ad.targetUserTypes)
                ? ad.targetUserTypes
                : [],
            minDailyFootTraffic: (_a = ad.minDailyFootTraffic) !== null && _a !== void 0 ? _a : "",
            maxDailyFootTraffic: (_b = ad.maxDailyFootTraffic) !== null && _b !== void 0 ? _b : "",
            priority: (_c = ad.priority) !== null && _c !== void 0 ? _c : 0,
            startAt: ad.startAt ? new Date(ad.startAt).toISOString().slice(0, 16) : "",
            endAt: ad.endAt ? new Date(ad.endAt).toISOString().slice(0, 16) : "",
        });
    };
    return (<div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-primary"/>
            <h1 className="text-2xl font-bold text-foreground">
              Geo Ads Studio
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Build onsite campaigns tied to real locations. All placements are
            location-based.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5"/>
                {editingId ? "Edit Campaign" : "Create Campaign"}
              </CardTitle>
              <CardDescription>
                Define geo targeting, placements, and creative. Click the map to
                set the geofence center.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={form.name} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); });
        }} placeholder="Downtown lunch push"/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full h-10 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--field-bg)] px-3 text-sm" value={form.status} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { status: e.target.value })); });
        }}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Headline</label>
                  <Input value={form.title} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { title: e.target.value })); });
        }} placeholder="Late-night specials nearby"/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CTA Text</label>
                  <Input value={form.ctaText} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { ctaText: e.target.value })); });
        }}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Body</label>
                <textarea className="w-full min-h-[90px] rounded-md border border-[color:var(--border-strong)] bg-[color:var(--field-bg)] px-3 py-2 text-sm text-[color:var(--text-primary)]" value={form.body} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { body: e.target.value })); });
        }} placeholder="Drop in for 20% off at the truck row."/>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target URL</label>
                  <Input value={form.targetUrl} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { targetUrl: e.target.value })); });
        }} placeholder="https://mealscout.us/deals"/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Media URL</label>
                  <Input value={form.mediaUrl} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { mediaUrl: e.target.value })); });
        }} placeholder="https://..."/>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Input type="number" value={form.priority} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { priority: Number(e.target.value) || 0 })); });
        }}/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start</label>
                  <Input type="datetime-local" value={form.startAt} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { startAt: e.target.value })); });
        }}/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End</label>
                  <Input type="datetime-local" value={form.endAt} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { endAt: e.target.value })); });
        }}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Placements</label>
                <div className="flex flex-wrap gap-3 text-sm">
                  {placementOptions.map(function (placement) { return (<label key={placement} className="flex items-center gap-2">
                      <input type="checkbox" checked={form.placements.includes(placement)} onChange={function (e) {
                setForm(function (prev) {
                    var next = new Set(prev.placements);
                    if (e.target.checked) {
                        next.add(placement);
                    }
                    else {
                        next.delete(placement);
                    }
                    return __assign(__assign({}, prev), { placements: Array.from(next) });
                });
            }}/>
                      {placement}
                    </label>); })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target User Types</label>
                <div className="flex flex-wrap gap-3 text-sm">
                  {userTypeOptions.map(function (type) { return (<label key={type} className="flex items-center gap-2">
                      <input type="checkbox" checked={form.targetUserTypes.includes(type)} onChange={function (e) {
                setForm(function (prev) {
                    var next = new Set(prev.targetUserTypes);
                    if (e.target.checked) {
                        next.add(type);
                    }
                    else {
                        next.delete(type);
                    }
                    return __assign(__assign({}, prev), { targetUserTypes: Array.from(next) });
                });
            }}/>
                      {type}
                    </label>); })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow all user types.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Min Daily Foot Traffic
                  </label>
                  <Input type="number" value={form.minDailyFootTraffic} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { minDailyFootTraffic: e.target.value
                    ? Number(e.target.value)
                    : "" })); });
        }} placeholder="Optional"/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Daily Foot Traffic
                  </label>
                  <Input type="number" value={form.maxDailyFootTraffic} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { maxDailyFootTraffic: e.target.value
                    ? Number(e.target.value)
                    : "" })); });
        }} placeholder="Optional"/>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitude</label>
                  <Input type="number" value={form.geofenceLat} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { geofenceLat: Number(e.target.value) })); });
        }}/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitude</label>
                  <Input type="number" value={form.geofenceLng} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { geofenceLng: Number(e.target.value) })); });
        }}/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Radius (m)</label>
                  <Input type="number" value={form.geofenceRadiusM} onChange={function (e) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { geofenceRadiusM: Number(e.target.value) })); });
        }}/>
                </div>
              </div>

              <div className="h-64 rounded-xl border border-[color:var(--border-subtle)] overflow-hidden">
                <GeoAdMap center={mapCenter} radius={form.geofenceRadiusM} onCenterChange={function (lat, lng) {
            return setForm(function (prev) { return (__assign(__assign({}, prev), { geofenceLat: Number(lat.toFixed(6)), geofenceLng: Number(lng.toFixed(6)) })); });
        }}/>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSubmit} disabled={createAd.isPending || updateAd.isPending}>
                  {(createAd.isPending || updateAd.isPending) && (<Loader2 className="w-4 h-4 animate-spin"/>)}
                  {editingId ? "Save Changes" : "Create Campaign"}
                </Button>
                {editingId && (<Button variant="secondary" onClick={function () {
                setEditingId(null);
                setForm(emptyForm);
            }}>
                    New Campaign
                  </Button>)}
                {editingId && (<Button variant="destructive" onClick={function () { return archiveAd.mutate(editingId); }} disabled={archiveAd.isPending}>
                    Archive
                  </Button>)}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Metrics</CardTitle>
                <CardDescription>Latest metrics for the selected ad.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingId ? (<div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg border">
                      <div className="text-muted-foreground">Impressions</div>
                      <div className="text-xl font-semibold">
                        {(_a = metrics === null || metrics === void 0 ? void 0 : metrics.impressions) !== null && _a !== void 0 ? _a : 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="text-muted-foreground">Clicks</div>
                      <div className="text-xl font-semibold">
                        {(_b = metrics === null || metrics === void 0 ? void 0 : metrics.clicks) !== null && _b !== void 0 ? _b : 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="text-muted-foreground">CTR</div>
                      <div className="text-xl font-semibold">
                        {(metrics === null || metrics === void 0 ? void 0 : metrics.ctr) ? "".concat((metrics.ctr * 100).toFixed(1), "%") : "0%"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="text-muted-foreground">Foot Traffic (24h)</div>
                      <div className="text-xl font-semibold">
                        {(_c = metrics === null || metrics === void 0 ? void 0 : metrics.footTraffic24h) !== null && _c !== void 0 ? _c : 0}
                      </div>
                    </div>
                  </div>) : (<p className="text-sm text-muted-foreground">
                    Select a campaign to see metrics.
                  </p>)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>
                  {ads.length} total campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (<div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    Loading campaigns...
                  </div>) : ads.length === 0 ? (<p className="text-sm text-muted-foreground">
                    No geo ads yet. Create the first campaign.
                  </p>) : (ads.map(function (ad) { return (<button key={ad.id} onClick={function () { return selectAd(ad); }} className={"w-full text-left border rounded-lg p-3 transition ".concat(editingId === ad.id
                ? "border-primary bg-primary/5"
                : "border-[color:var(--border-subtle)] hover:border-primary/50")}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{ad.name}</div>
                        <Badge variant="secondary">{ad.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ad.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Placements:{" "}
                        {Array.isArray(ad.placements)
                ? ad.placements.join(", ")
                : "none"}
                      </div>
                    </button>); }))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Navigation />
    </div>);
}
