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
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, MapPin, Truck, CheckCircle, ChevronDown, ChevronUp, AlertCircle, } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
function TruckDiscovery() {
    var _this = this;
    var _a = useLocation(), setLocation = _a[1];
    var user = useAuth().user;
    var toast = useToast().toast;
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState([]), events = _c[0], setEvents = _c[1];
    var _d = useState(""), error = _d[0], setError = _d[1];
    var _e = useState(new Set()), interestedEvents = _e[0], setInterestedEvents = _e[1];
    var _f = useState(null), submittingId = _f[0], setSubmittingId = _f[1];
    var _g = useState(new Set()), expandedSeries = _g[0], setExpandedSeries = _g[1];
    var _h = useState(null), myRestaurantId = _h[0], setMyRestaurantId = _h[1];
    useEffect(function () {
        var fetchData = function () { return __awaiter(_this, void 0, void 0, function () {
            var restaurantRes, restaurants, eventsRes, data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, 7, 8]);
                        return [4 /*yield*/, fetch("/api/restaurants/my")];
                    case 1:
                        restaurantRes = _a.sent();
                        if (!restaurantRes.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, restaurantRes.json()];
                    case 2:
                        restaurants = _a.sent();
                        if (restaurants.length > 0) {
                            setMyRestaurantId(restaurants[0].id);
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, fetch("/api/events")];
                    case 4:
                        eventsRes = _a.sent();
                        if (!eventsRes.ok) {
                            if (eventsRes.status === 401) {
                                setLocation("/login?redirect=/truck-discovery");
                                return [2 /*return*/];
                            }
                            throw new Error("Failed to fetch events");
                        }
                        return [4 /*yield*/, eventsRes.json()];
                    case 5:
                        data = _a.sent();
                        setEvents(data);
                        return [3 /*break*/, 8];
                    case 6:
                        err_1 = _a.sent();
                        setError(err_1.message);
                        return [3 /*break*/, 8];
                    case 7:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        fetchData();
    }, [setLocation]);
    var handleExpressInterest = function (eventId) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!myRestaurantId) {
                        toast({
                            title: "Truck Profile Required",
                            description: "You must have a truck profile to express interest.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setSubmittingId(eventId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/events/".concat(eventId, "/interests"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                restaurantId: myRestaurantId,
                                message: "I'm interested in this event!",
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to submit interest");
                case 4:
                    setInterestedEvents(function (prev) { return new Set(prev).add(eventId); });
                    toast({
                        title: "Interest Sent",
                        description: "The host can now contact you directly.",
                    });
                    return [3 /*break*/, 7];
                case 5:
                    err_2 = _a.sent();
                    toast({
                        title: "Error",
                        description: err_2.message,
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setSubmittingId(null);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var toggleSeries = function (seriesId) {
        setExpandedSeries(function (prev) {
            var next = new Set(prev);
            if (next.has(seriesId)) {
                next.delete(seriesId);
            }
            else {
                next.add(seriesId);
            }
            return next;
        });
    };
    // Group events by series
    var groupedData = events.reduce(function (acc, event) {
        if (event.seriesId && event.series) {
            var existingGroup = acc.series.find(function (g) { return g.seriesId === event.seriesId; });
            if (existingGroup) {
                existingGroup.occurrences.push(event);
                if (new Date(event.date) > new Date(existingGroup.latestDate)) {
                    existingGroup.latestDate = event.date;
                }
            }
            else {
                acc.series.push({
                    seriesId: event.seriesId,
                    seriesName: event.series.name,
                    host: event.host,
                    occurrences: [event],
                    earliestDate: event.date,
                    latestDate: event.date,
                });
            }
        }
        else {
            acc.standalone.push(event);
        }
        return acc;
    }, { series: [], standalone: [] });
    // Sort series by earliest occurrence
    groupedData.series.sort(function (a, b) {
        return new Date(a.earliestDate).getTime() - new Date(b.earliestDate).getTime();
    });
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600"/>
      </div>);
    }
    return (<div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Find Parking & Events
        </h1>
        <p className="text-slate-600">
          Browse host locations (gas stations, schools, breweries, etc.) and
          high-volume events looking for food trucks. Express interest to
          connect with hosts and event coordinators.
        </p>
      </div>

      {error && (<div className="p-4 bg-rose-50 text-rose-700 rounded-lg mb-6">
          {error}
        </div>)}

      {groupedData.series.length === 0 &&
            groupedData.standalone.length === 0 ? (<div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3"/>
          <h3 className="text-lg font-medium text-slate-900">
            No events available right now
          </h3>
          <p className="text-slate-500">
            Check back later for new host locations and events.
          </p>
        </div>) : (<div className="space-y-6">
          {/* Series Groups */}
          {groupedData.series.map(function (group) { return (<div key={group.seriesId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Series Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors" onClick={function () { return toggleSeries(group.seriesId); }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-900">
                        {group.seriesName}
                      </h3>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        Recurring Open Call
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500"/>
                        <span className="font-medium">
                          {group.host.businessName}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{group.host.address}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500"/>
                        <span>
                          {group.occurrences.length} occurrence
                          {group.occurrences.length !== 1 ? "s" : ""} •{" "}
                          {format(new Date(group.earliestDate), "MMM d")} -{" "}
                          {format(new Date(group.latestDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="ml-4">
                    {expandedSeries.has(group.seriesId) ? (<ChevronUp className="h-5 w-5"/>) : (<ChevronDown className="h-5 w-5"/>)}
                  </Button>
                </div>
              </div>

              {/* Occurrences List */}
              {expandedSeries.has(group.seriesId) && (<div className="divide-y divide-slate-100">
                  {group.occurrences.map(function (event) { return (<div key={event.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center font-semibold text-slate-900">
                              <Calendar className="h-4 w-4 mr-2 text-rose-500"/>
                              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-slate-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-rose-500"/>
                              {event.startTime} - {event.endTime}
                            </div>
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-2 text-rose-500"/>
                              Capacity: {event.maxTrucks} truck
                              {event.maxTrucks !== 1 ? "s" : ""}
                            </div>
                            {event.hardCapEnabled && (<Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                                <AlertCircle className="h-3 w-3 mr-1"/>
                                Strict Cap
                              </Badge>)}
                          </div>

                          <p className="text-xs text-slate-500">
                            Part of an Open Call series • Express interest for
                            this date
                          </p>
                        </div>

                        <Button onClick={function () { return handleExpressInterest(event.id); }} disabled={submittingId === event.id ||
                            interestedEvents.has(event.id)} className="min-w-[140px]">
                          {submittingId === event.id ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : interestedEvents.has(event.id) ? (<>
                              <CheckCircle className="h-4 w-4 mr-2"/>
                              Interest Sent
                            </>) : ("Express Interest")}
                        </Button>
                      </div>
                    </div>); })}
                </div>)}
            </div>); })}

          {/* Standalone Events */}
          {groupedData.standalone.length > 0 && (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupedData.standalone.map(function (event) { return (<div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                          {event.host.businessName}
                        </h3>
                        <div className="flex items-center text-slate-500 text-sm mt-1">
                          <MapPin className="h-3 w-3 mr-1"/>
                          <span className="line-clamp-1">
                            {event.host.address}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 capitalize">
                        {event.host.locationType}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-700">
                        <Calendar className="h-4 w-4 mr-2 text-rose-500"/>
                        <span className="font-medium">
                          {format(new Date(event.date), "EEEE, MMMM d")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-slate-700">
                        <Clock className="h-4 w-4 mr-2 text-rose-500"/>
                        <span>
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-slate-700">
                        <Truck className="h-4 w-4 mr-2 text-rose-500"/>
                        <span>
                          Capacity: {event.maxTrucks} truck
                          {event.maxTrucks !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Interest-based only. No payments for events.
                      </div>
                      {event.hardCapEnabled && (<Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                          <AlertCircle className="h-3 w-3 mr-1"/>
                          Strict Cap
                        </Badge>)}
                    </div>

                    <Button className="w-full" onClick={function () { return handleExpressInterest(event.id); }} disabled={submittingId === event.id ||
                        interestedEvents.has(event.id)}>
                      {submittingId === event.id ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : interestedEvents.has(event.id) ? (<>
                          <CheckCircle className="h-4 w-4 mr-2"/>
                          Interest Sent
                        </>) : ("Express Interest")}
                    </Button>
                  </div>
                </div>); })}
            </div>)}
        </div>)}

    </div>);
}
export default TruckDiscovery;
