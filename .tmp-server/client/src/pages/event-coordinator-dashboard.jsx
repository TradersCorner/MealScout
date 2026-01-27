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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Loader2, Plus, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function EventCoordinatorDashboard() {
    var _this = this;
    var _a = useAuth(), user = _a.user, isAuthenticated = _a.isAuthenticated, isLoading = _a.isLoading;
    var toast = useToast().toast;
    var _b = useLocation(), setLocation = _b[1];
    var _c = useState(true), isLoadingPage = _c[0], setIsLoadingPage = _c[1];
    var _d = useState([]), events = _d[0], setEvents = _d[1];
    var _e = useState(false), isCreating = _e[0], setIsCreating = _e[1];
    var _f = useState(""), createError = _f[0], setCreateError = _f[1];
    var inputClassName = "event-form-field";
    var _g = useState({
        organizationName: "",
        address: "",
        city: "",
        state: "",
        contactPhone: "",
        eventName: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        maxTrucks: 1,
    }), formData = _g[0], setFormData = _g[1];
    useEffect(function () {
        if (isLoading) {
            return;
        }
        if (!isAuthenticated) {
            setLocation("/login?redirect=/event-coordinator/dashboard");
            return;
        }
        if ((user === null || user === void 0 ? void 0 : user.userType) !== "event_coordinator") {
            setLocation("/");
            return;
        }
        var loadEvents = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoadingPage(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("/api/event-coordinator/events")];
                    case 2:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to load events");
                        }
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _a.sent();
                        setEvents(Array.isArray(data) ? data : []);
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        toast({
                            title: "Error",
                            description: error_1.message || "Failed to load events.",
                            variant: "destructive",
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        setIsLoadingPage(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        loadEvents();
    }, [isAuthenticated, isLoading, setLocation, toast, user === null || user === void 0 ? void 0 : user.userType]);
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, created_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setCreateError("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/event-coordinator/events", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                businessName: formData.organizationName,
                                address: formData.address,
                                city: formData.city,
                                state: formData.state,
                                contactPhone: formData.contactPhone,
                                name: formData.eventName,
                                description: formData.description,
                                date: formData.date,
                                startTime: formData.startTime,
                                endTime: formData.endTime,
                                maxTrucks: Number(formData.maxTrucks),
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to create event");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    created_1 = _a.sent();
                    setEvents(function (prev) { return __spreadArray(__spreadArray([], prev, true), [created_1], false); });
                    setIsCreating(false);
                    setFormData({
                        organizationName: "",
                        address: "",
                        city: "",
                        state: "",
                        contactPhone: "",
                        eventName: "",
                        description: "",
                        date: "",
                        startTime: "",
                        endTime: "",
                        maxTrucks: 1,
                    });
                    toast({
                        title: "Event Created",
                        description: "Your event is now visible on the Events page and map.",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    setCreateError(error_2.message || "Failed to create event");
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading || isLoadingPage) {
        return (<div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600"/>
      </div>);
    }
    return (<div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Event Coordinator Dashboard
          </h1>
          <p className="text-slate-600">
            Post events and invite food trucks. Payments are handled offline.
          </p>
        </div>
        <Button onClick={function () { return setIsCreating(!isCreating); }}>
          {isCreating ? ("Cancel") : (<>
              <Plus className="mr-2 h-4 w-4"/> New Event
            </>)}
        </Button>
      </div>

      {isCreating && (<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 event-form">
          <h2 className="text-lg font-semibold mb-4">Create Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {createError && (<div className="p-3 bg-rose-50 text-rose-700 rounded-md text-sm">
                {createError}
              </div>)}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input id="organizationName" value={formData.organizationName} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { organizationName: e.target.value }));
            }} className={inputClassName} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" value={formData.contactPhone} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { contactPhone: e.target.value }));
            }} className={inputClassName} required/>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { address: e.target.value }));
            }} className={inputClassName} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { city: e.target.value }));
            }} className={inputClassName} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { state: e.target.value }));
            }} className={inputClassName} required/>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input id="eventName" value={formData.eventName} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { eventName: e.target.value }));
            }} className={inputClassName} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTrucks">Trucks Needed</Label>
                <Input id="maxTrucks" type="number" min="1" max="50" value={formData.maxTrucks} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { maxTrucks: Number(e.target.value) }));
            }} placeholder="10" className={inputClassName} required/>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={formData.date} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { date: e.target.value }));
            }} className={inputClassName} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" value={formData.startTime} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { startTime: e.target.value }));
            }} className={inputClassName} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={formData.endTime} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { endTime: e.target.value }));
            }} className={inputClassName} required/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { description: e.target.value }));
            }} placeholder="Event details, expectations, vendor notes" className={inputClassName} rows={4}/>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Publish Event</Button>
            </div>
          </form>
        </div>)}

      <Tabs defaultValue="upcoming" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Your Events</h2>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {events.filter(function (e) { return new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)); }).length === 0 ? (<Card className="p-8 text-center text-slate-600">
              No upcoming events yet.
            </Card>) : (<div className="grid gap-4">
              {events
                .filter(function (e) {
                return new Date(e.date) >=
                    new Date(new Date().setHours(0, 0, 0, 0));
            })
                .map(function (event) { return (<Card key={event.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        {event.name || "Food Truck Event"}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {event.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4"/>
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4"/>
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4"/>
                        {event.host.businessName} - {event.host.address}
                      </div>
                    </div>
                  </Card>); })}
            </div>)}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {events.filter(function (e) { return new Date(e.date) < new Date(new Date().setHours(0, 0, 0, 0)); }).length === 0 ? (<Card className="p-8 text-center text-slate-600">
              No past events yet.
            </Card>) : (<div className="grid gap-4 opacity-80">
              {events
                .filter(function (e) {
                return new Date(e.date) <
                    new Date(new Date().setHours(0, 0, 0, 0));
            })
                .map(function (event) { return (<Card key={event.id} className="p-5 space-y-2">
                    <h3 className="font-semibold text-slate-900">
                      {event.name || "Food Truck Event"}
                    </h3>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4"/>
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4"/>
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  </Card>); })}
            </div>)}
        </TabsContent>
      </Tabs>
    </div>);
}
