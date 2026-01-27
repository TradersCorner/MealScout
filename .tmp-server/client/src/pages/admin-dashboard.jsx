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
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Shield, Users, Store, DollarSign, AlertCircle, CheckCircle, XCircle, Clock, BarChart3, Activity, Package, Settings, Eye, MapPin, Phone, Mail, Calendar, CreditCard, UserMinus, } from "lucide-react";
import { Link } from "wouter";
import QuickDashboardAccess from "@/components/quick-dashboard-access";
import { getOptimizedImageUrl } from "@/lib/images";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
function TruckImportPanel(_a) {
    var _this = this;
    var enabled = _a.enabled;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _b = useState(""), source = _b[0], setSource = _b[1];
    var _c = useState(null), file = _c[0], setFile = _c[1];
    var _d = useState(null), lastResult = _d[0], setLastResult = _d[1];
    var _e = useQuery({
        queryKey: ["/api/admin/truck-imports"],
        enabled: enabled,
    }).data, batches = _e === void 0 ? [] : _e;
    var uploadImport = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var formData, res, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!file) {
                            throw new Error("Please select a file to upload.");
                        }
                        formData = new FormData();
                        formData.append("file", file);
                        if (source.trim()) {
                            formData.append("source", source.trim());
                        }
                        return [4 /*yield*/, fetch("/api/admin/truck-imports", {
                                method: "POST",
                                body: formData,
                                credentials: "include",
                            })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error(text || "Failed to upload import file.");
                    case 3: return [4 /*yield*/, res.json()];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (data) {
            setLastResult(data);
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/truck-imports"] });
            toast({
                title: "Import queued",
                description: "Imported ".concat(data.importedRows, " rows."),
            });
        },
        onError: function (error) {
            toast({
                title: "Import failed",
                description: error.message || "Unable to import file.",
                variant: "destructive",
            });
        },
    });
    return (<Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5"/>
          Food Truck Imports
        </CardTitle>
        <CardDescription>
          Upload CSV or XLSX lists to preload food trucks for claims.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Source</label>
            <input type="text" value={source} onChange={function (e) { return setSource(e.target.value); }} className="w-full px-3 py-2 border rounded-md" placeholder="State registry, county export, etc."/>
          </div>
          <div>
            <label className="text-sm font-medium">File</label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={function (e) { var _a; return setFile(((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) || null); }} className="w-full px-3 py-2 border rounded-md"/>
          </div>
          <Button type="button" onClick={function () { return uploadImport.mutate(); }} disabled={uploadImport.isPending} data-testid="button-import-trucks">
            {uploadImport.isPending ? "Uploading..." : "Upload Import"}
          </Button>
        </div>

        {lastResult && (<div className="p-3 rounded-md bg-muted/40 text-sm">
            <div>Batch: {lastResult.batchId}</div>
            <div>Imported: {lastResult.importedRows}</div>
            <div>Duplicates: {lastResult.duplicateRows}</div>
            <div>Missing Required: {lastResult.missingRows}</div>
          </div>)}

        <div className="space-y-2">
          <div className="text-sm font-semibold">Recent Imports</div>
          {batches.length === 0 ? (<div className="text-xs text-muted-foreground">
              No import batches yet.
            </div>) : (<div className="space-y-2">
              {batches.slice(0, 5).map(function (batch) { return (<div key={batch.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                  <div>
                    <div className="font-semibold">{batch.fileName}</div>
                    <div className="text-muted-foreground">
                      {batch.source || "Unspecified source"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>Imported: {batch.importedRows}</div>
                    <div className="text-muted-foreground">
                      Skipped: {batch.skippedRows}
                    </div>
                  </div>
                </div>); })}
            </div>)}
        </div>
      </CardContent>
    </Card>);
}
// Manual User/Host Creation Component (Combined)
function ManualUserCreation(_a) {
    var _this = this;
    var adminUser = _a.adminUser;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _b = useState({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        businessName: "",
        address: "",
        cuisineType: "",
        latitude: "",
        longitude: "",
        locationType: "private_residence",
        footTraffic: "low",
        amenities: [],
        userType: "customer",
    }), formData = _b[0], setFormData = _b[1];
    var _c = useState(false), geocoding = _c[0], setGeocoding = _c[1];
    var _d = useState(""), inviteSentEmail = _d[0], setInviteSentEmail = _d[1];
    var createUser = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/create", data)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (data) {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setInviteSentEmail(formData.email);
            toast({
                title: "Account Created",
                description: "Setup link sent. The user will complete their profile and password.",
            });
            // Reset form
            setFormData({
                email: "",
                firstName: "",
                lastName: "",
                phone: "",
                businessName: "",
                address: "",
                cuisineType: "",
                latitude: "",
                longitude: "",
                locationType: "private_residence",
                footTraffic: "low",
                amenities: [],
                userType: "food_truck",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to create account.",
                variant: "destructive",
            });
        },
    });
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!(formData.userType === "host" &&
                        formData.address &&
                        !formData.latitude)) return [3 /*break*/, 6];
                    setGeocoding(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(formData.address)))];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data && data[0]) {
                        formData.latitude = data[0].lat;
                        formData.longitude = data[0].lon;
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error("Failed to geocode:", error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setGeocoding(false);
                    return [7 /*endfinally*/];
                case 6:
                    createUser.mutate(formData);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleUserTypeChange = function (newType) {
        // Reset conditional fields when type changes
        setFormData(__assign(__assign({}, formData), { userType: newType, businessName: "", address: "", cuisineType: "", latitude: "", longitude: "", locationType: "private_residence", footTraffic: "low", amenities: [] }));
    };
    var handleGeocode = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!formData.address)
                        return [2 /*return*/];
                    setGeocoding(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(formData.address)))];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data && data[0]) {
                        setFormData(__assign(__assign({}, formData), { latitude: data[0].lat, longitude: data[0].lon }));
                        toast({
                            title: "Coordinates Found",
                            description: "Location has been geocoded successfully.",
                        });
                    }
                    else {
                        toast({
                            title: "Not Found",
                            description: "Could not find coordinates for this address. Please enter manually.",
                            variant: "destructive",
                        });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to geocode address.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setGeocoding(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-4">
      {inviteSentEmail && (<div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <p className="font-semibold text-green-800">Setup Email Sent</p>
          <p className="text-sm text-green-700">
            Invite sent to {inviteSentEmail}. The user will finish their profile
            and set a password from the link.
          </p>
          <Button size="sm" variant="outline" onClick={function () { return setInviteSentEmail(""); }}>
            Dismiss
          </Button>
        </div>)}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* User Type - First Field */}
        <div>
          <label className="text-sm font-medium">Account Type</label>
          <select value={formData.userType} onChange={function (e) { return handleUserTypeChange(e.target.value); }} className="w-full px-3 py-2 border rounded-md">
            <option value="food_truck">Food Truck</option>
            <option value="restaurant_owner">Restaurant Owner</option>
            <option value="customer">Customer</option>
            <option value="host">Host (Parking/Events)</option>
            <option value="event_coordinator">Event Coordinator</option>
            <option value="staff">Staff</option>
            {((adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "admin" ||
            (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin") && (<option value="admin">Admin</option>)}
            {(adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin" && (<option value="super_admin">Super Admin</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.userType === "food_truck" &&
            "Food truck owner - mobile restaurant, create deals, manage location"}
            {formData.userType === "customer" &&
            "Regular customer - can claim deals and browse restaurants"}
            {formData.userType === "restaurant_owner" &&
            "Business owner - manage restaurant and create deals"}
            {formData.userType === "staff" &&
            "Staff member - help manage restaurant operations"}
            {formData.userType === "event_coordinator" &&
            "Event coordinator - organize events (NO PAYMENTS through us)"}
            {formData.userType === "host" &&
            "Host - rent parking spots/lots to food trucks (hourly/daily/weekly/monthly)"}
          </p>
        </div>

        {/* Common Fields */}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input type="email" required value={formData.email} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { email: e.target.value }));
        }} className="w-full px-3 py-2 border rounded-md" placeholder="user@example.com"/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <input type="text" value={formData.firstName} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { firstName: e.target.value }));
        }} className="w-full px-3 py-2 border rounded-md"/>
          </div>

          <div>
            <label className="text-sm font-medium">Last Name</label>
            <input type="text" value={formData.lastName} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { lastName: e.target.value }));
        }} className="w-full px-3 py-2 border rounded-md"/>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Phone</label>
          <input type="tel" value={formData.phone} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { phone: e.target.value }));
        }} className="w-full px-3 py-2 border rounded-md" placeholder="+1234567890"/>
        </div>

        {/* Restaurant Owner & Food Truck Specific Fields */}
        {(formData.userType === "restaurant_owner" ||
            formData.userType === "food_truck") && (<>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Restaurant Information
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Business Name</label>
                  <input type="text" required value={formData.businessName} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { businessName: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md" placeholder="Joe's Pizza"/>
                </div>

                <div>
                  <label className="text-sm font-medium">Address</label>
                  <input type="text" required value={formData.address} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { address: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md" placeholder="123 Main St, City, State 12345"/>
                </div>

                <div>
                  <label className="text-sm font-medium">Cuisine Type</label>
                  <input type="text" required value={formData.cuisineType} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { cuisineType: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md" placeholder="Italian, Mexican, American, etc."/>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Restaurant will be created as verified
                and active. No document verification required for manual
                onboarding.
              </p>
            </div>
          </>)}

        {/* Staff Specific Fields */}
        {formData.userType === "staff" && (<>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">Staff Information</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Restaurant/Business Name
                  </label>
                  <input type="text" required value={formData.businessName} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { businessName: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md" placeholder="Which restaurant will they work for?"/>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Staff member will need to be assigned to
                a restaurant after creation.
              </p>
            </div>
          </>)}

        {/* Event Coordinator Specific Fields */}
        {formData.userType === "event_coordinator" && (<>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Event Coordinator Information
              </h4>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-xs text-purple-800">
                  <strong>Event Coordinator:</strong> Organizes food truck
                  events and coordinates logistics.
                  <br />
                  <strong className="text-red-700">
                    IMPORTANT: NO payments go through us. They handle all
                    payments directly.
                  </strong>
                </p>
              </div>
            </div>
          </>)}

        {/* Host Specific Fields */}
        {formData.userType === "host" && (<>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Host Location Information
              </h4>

              <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-3">
                <p className="text-xs text-green-800">
                  <strong>Host Model:</strong> Hosts create lots with 1+ spots.
                  They set rental prices (hourly/daily/weekly/monthly).
                  <br />
                  <strong>
                    We add $10 to every booking - host gets their price, we get
                    $10.
                  </strong>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Location/Business Name
                  </label>
                  <input type="text" required value={formData.businessName} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { businessName: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md" placeholder="Park name, business name, etc."/>
                </div>

                <div>
                  <label className="text-sm font-medium">Full Address</label>
                  <input type="text" required value={formData.address} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { address: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md" placeholder="123 Main St, City, State 12345"/>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates will be automatically geocoded from this address
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Location Type</label>
                  <select value={formData.locationType} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { locationType: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md">
                    <option value="private_residence">Private Residence</option>
                    <option value="business">Business</option>
                    <option value="parking_lot">Parking Lot</option>
                    <option value="event_space">Event Space</option>
                    <option value="public_park">Public Park</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Foot Traffic</label>
                  <select value={formData.footTraffic} onChange={function (e) {
                return setFormData(__assign(__assign({}, formData), { footTraffic: e.target.value }));
            }} className="w-full px-3 py-2 border rounded-md">
                    <option value="low">Low (Quiet area)</option>
                    <option value="medium">Medium (Moderate activity)</option>
                    <option value="high">High (Busy area)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Amenities (Optional)
                  </label>
                  <div className="space-y-2">
                    {["Power", "Water", "Restrooms", "Wifi", "Seating"].map(function (amenity) { return (<label key={amenity} className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.amenities.includes(amenity.toLowerCase())} onChange={function (e) {
                    var value = amenity.toLowerCase();
                    if (e.target.checked) {
                        setFormData(__assign(__assign({}, formData), { amenities: __spreadArray(__spreadArray([], formData.amenities, true), [value], false) }));
                    }
                    else {
                        setFormData(__assign(__assign({}, formData), { amenities: formData.amenities.filter(function (a) { return a !== value; }) }));
                    }
                }} className="rounded"/>
                          <span className="text-sm">{amenity}</span>
                        </label>); })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-800">
                <strong>Host Account:</strong> Can list parking spots and event
                spaces for food trucks to use. Will have access to host
                dashboard.
              </p>
            </div>
          </>)}

        <Button type="submit" disabled={createUser.isPending} className="w-full">
          {createUser.isPending ? "Creating..." : "Create Account"}
        </Button>
      </form>
    </div>);
}
// Host Location Manager Component
function HostLocationManager() {
    var _this = this;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _a = useState(null), editingHostId = _a[0], setEditingHostId = _a[1];
    var _b = useState({ lat: "", lng: "" }), coordinates = _b[0], setCoordinates = _b[1];
    var _c = useState(false), geocoding = _c[0], setGeocoding = _c[1];
    var _d = useQuery({
        queryKey: ["/api/admin/hosts"],
    }), _e = _d.data, hosts = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    var updateCoordinates = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var hostId = _b.hostId, lat = _b.lat, lng = _b.lng;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/hosts/".concat(hostId, "/coordinates"), {
                            latitude: lat,
                            longitude: lng,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/hosts"] });
            setEditingHostId(null);
            setCoordinates({ lat: "", lng: "" });
            toast({ title: "Success", description: "Host coordinates updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update coordinates",
                variant: "destructive",
            });
        },
    });
    var geocodeHost = function (host) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!host.address) {
                        toast({
                            title: "Error",
                            description: "Host has no address",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setGeocoding(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(host.address)), { headers: { "User-Agent": "MealScout/1.0" } })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data && data.length > 0) {
                        setCoordinates({ lat: data[0].lat, lng: data[0].lon });
                        setEditingHostId(host.id);
                        toast({
                            title: "Success",
                            description: "Address geocoded - click Update to save",
                        });
                    }
                    else {
                        toast({
                            title: "Error",
                            description: "Could not find coordinates",
                            variant: "destructive",
                        });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_3 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to geocode address",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setGeocoding(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading)
        return <p>Loading hosts...</p>;
    return (<div className="space-y-3">
      {hosts.length === 0 ? (<p className="text-sm text-muted-foreground">
          No hosts found. Create one above!
        </p>) : (hosts.map(function (host) { return (<div key={host.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{host.businessName}</p>
                <p className="text-sm text-muted-foreground">{host.address}</p>
                {host.latitude && host.longitude && (<p className="text-xs text-green-600 mt-1">
                    📍 {host.latitude}, {host.longitude}
                  </p>)}
              </div>
              <Button size="sm" variant="outline" onClick={function () { return geocodeHost(host); }} disabled={geocoding}>
                {geocoding ? "..." : "Geocode"}
              </Button>
            </div>

            {editingHostId === host.id && (<div className="pt-2 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Latitude" value={coordinates.lat} onChange={function (e) {
                    return setCoordinates(__assign(__assign({}, coordinates), { lat: e.target.value }));
                }} className="px-2 py-1 border rounded text-sm"/>
                  <input type="text" placeholder="Longitude" value={coordinates.lng} onChange={function (e) {
                    return setCoordinates(__assign(__assign({}, coordinates), { lng: e.target.value }));
                }} className="px-2 py-1 border rounded text-sm"/>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={function () {
                    return updateCoordinates.mutate({
                        hostId: host.id,
                        lat: coordinates.lat,
                        lng: coordinates.lng,
                    });
                }} disabled={!coordinates.lat ||
                    !coordinates.lng ||
                    updateCoordinates.isPending}>
                    Update
                  </Button>
                  <Button size="sm" variant="outline" onClick={function () {
                    setEditingHostId(null);
                    setCoordinates({ lat: "", lng: "" });
                }}>
                    Cancel
                  </Button>
                </div>
              </div>)}
          </div>); }))}
    </div>);
}
// Staff Management Tab Component
function StaffManagementTab() {
    var _this = this;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _a = useState(""), selectedUserId = _a[0], setSelectedUserId = _a[1];
    var _b = useQuery({
        queryKey: ["/api/admin/staff"],
    }), _c = _b.data, staffMembers = _c === void 0 ? [] : _c, loadingStaff = _b.isLoading;
    var _d = useQuery({
        queryKey: ["/api/admin/users"],
    }).data, allUsers = _d === void 0 ? [] : _d;
    var promoteToStaff = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/staff/".concat(userId, "/promote"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setSelectedUserId("");
            toast({
                title: "Staff Promoted",
                description: "User has been promoted to staff role.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to promote user to staff.",
                variant: "destructive",
            });
        },
    });
    var demoteStaff = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/staff/".concat(userId, "/demote"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({
                title: "Staff Demoted",
                description: "Staff member has been demoted to customer role.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to demote staff member.",
                variant: "destructive",
            });
        },
    });
    var eligibleUsers = allUsers.filter(function (user) {
        return user.userType !== "admin" &&
            user.userType !== "staff" &&
            user.userType !== "super_admin";
    });
    // Filter out super_admin from staff members list (they should never appear here)
    var displayStaffMembers = staffMembers.filter(function (staff) { return staff.userType !== "super_admin"; });
    return (<div className="space-y-6">
      {/* Current Staff */}
      <div>
        <h3 className="font-semibold mb-3">Current Staff Members</h3>
        {loadingStaff ? (<p className="text-muted-foreground">Loading...</p>) : displayStaffMembers.length === 0 ? (<p className="text-muted-foreground">No staff members yet.</p>) : (<div className="space-y-2">
            {displayStaffMembers.map(function (staff) { return (<div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {staff.firstName} {staff.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {staff.email}
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={function () {
                    if (window.confirm("Remove ".concat(staff.email, " from staff role?"))) {
                        demoteStaff.mutate(staff.id);
                    }
                }} disabled={demoteStaff.isPending}>
                  <UserMinus className="w-4 h-4 mr-1"/>
                  Remove Staff
                </Button>
              </div>); })}
          </div>)}
      </div>

      {/* Promote User */}
      <div>
        <h3 className="font-semibold mb-3">Promote User to Staff</h3>
        <div className="flex gap-3">
          <select className="flex-1 px-3 py-2 border rounded-md bg-background" value={selectedUserId} onChange={function (e) { return setSelectedUserId(e.target.value); }}>
            <option value="">Select user...</option>
            {eligibleUsers.map(function (user) { return (<option key={user.id} value={user.id}>
                {user.email} ({user.firstName} {user.lastName}) -{" "}
                {user.userType}
              </option>); })}
          </select>
          <Button onClick={function () {
            if (selectedUserId) {
                promoteToStaff.mutate(selectedUserId);
            }
        }} disabled={!selectedUserId || promoteToStaff.isPending}>
            Promote to Staff
          </Button>
        </div>
      </div>

      {/* Quick Link */}
      <div className="pt-4 border-t">
        <Link href="/staff">
          <Button variant="outline">Go to Staff Dashboard →</Button>
        </Link>
      </div>
    </div>);
}
export default function AdminDashboard() {
    var _this = this;
    var _a;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _b = useState("overview"), selectedTab = _b[0], setSelectedTab = _b[1];
    var _c = useState(null), selectedUser = _c[0], setSelectedUser = _c[1];
    var _d = useState(false), userDetailsOpen = _d[0], setUserDetailsOpen = _d[1];
    var _e = useState("type"), userSortKey = _e[0], setUserSortKey = _e[1];
    var _f = useState("asc"), userSortDir = _f[0], setUserSortDir = _f[1];
    var _g = useState(""), userSearch = _g[0], setUserSearch = _g[1];
    var _h = useState("all"), userTypeFilter = _h[0], setUserTypeFilter = _h[1];
    var _j = useState(null), selectedDeal = _j[0], setSelectedDeal = _j[1];
    var _k = useState(false), dealDetailsOpen = _k[0], setDealDetailsOpen = _k[1];
    var _l = useState(7), extendDays = _l[0], setExtendDays = _l[1];
    var _m = useState(null), userEdits = _m[0], setUserEdits = _m[1];
    var _o = useState({}), parkingPassEdits = _o[0], setParkingPassEdits = _o[1];
    var _p = useState({}), addressEdits = _p[0], setAddressEdits = _p[1];
    var _q = useState({}), hostEdits = _q[0], setHostEdits = _q[1];
    var _r = useState({}), restaurantEdits = _r[0], setRestaurantEdits = _r[1];
    var _s = useState({}), dealEdits = _s[0], setDealEdits = _s[1];
    var _t = useState({}), eventEdits = _t[0], setEventEdits = _t[1];
    var _u = useState({}), seriesEdits = _u[0], setSeriesEdits = _u[1];
    var _v = useState({}), bookingEdits = _v[0], setBookingEdits = _v[1];
    var _w = useState({
        label: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        type: "other",
        isDefault: false,
    }), newAddress = _w[0], setNewAddress = _w[1];
    var _x = useState({
        businessName: "",
        address: "",
        city: "",
        state: "",
        locationType: "other",
        expectedFootTraffic: "",
        contactPhone: "",
        notes: "",
    }), newHostLocation = _x[0], setNewHostLocation = _x[1];
    var handleLogout = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, , 2, 3]);
                    return [4 /*yield*/, apiRequest("POST", "/api/auth/logout")];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    window.location.href = "/";
                    return [7 /*endfinally*/];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Check admin authentication
    var _y = useQuery({
        queryKey: ["/api/auth/admin/verify"],
        retry: false,
    }), adminUser = _y.data, isAuthLoading = _y.isLoading;
    var isStaff = (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "staff";
    var isAdminOrSuper = (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "admin" || (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin";
    // Fetch dashboard stats
    var _z = useQuery({
        queryKey: ["/api/admin/stats"],
        enabled: !!adminUser,
    }), stats = _z.data, statsLoading = _z.isLoading;
    // Fetch pending restaurants
    var _0 = useQuery({
        queryKey: ["/api/admin/restaurants/pending"],
        enabled: !!adminUser && selectedTab === "restaurants",
    }).data, pendingRestaurants = _0 === void 0 ? [] : _0;
    // Fetch all users
    var _1 = useQuery({
        queryKey: ["/api/admin/users"],
        enabled: !!adminUser && selectedTab === "users",
    }).data, users = _1 === void 0 ? [] : _1;
    var _2 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "parking-pass"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, parkingPasses = _2 === void 0 ? [] : _2;
    var _3 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "hosts"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, userHosts = _3 === void 0 ? [] : _3;
    var _4 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "restaurants"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, userRestaurants = _4 === void 0 ? [] : _4;
    var _5 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "deals"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, userDeals = _5 === void 0 ? [] : _5;
    var _6 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "events"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, userEvents = _6 === void 0 ? [] : _6;
    var _7 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "event-series"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, userEventSeries = _7 === void 0 ? [] : _7;
    var userParkingBookings = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "parking-pass-bookings"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data;
    var _8 = useQuery({
        queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "addresses"],
        enabled: !!adminUser && !!(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id) && userDetailsOpen,
    }).data, userAddresses = _8 === void 0 ? [] : _8;
    var sortedUsers = useMemo(function () {
        var typeOrder = [
            "super_admin",
            "admin",
            "staff",
            "restaurant_owner",
            "food_truck",
            "host",
            "event_coordinator",
            "customer",
        ];
        var orderMap = new Map(typeOrder.map(function (type, index) { return [type, index]; }));
        var normalized = __spreadArray([], users, true);
        normalized.sort(function (a, b) {
            var _a, _b;
            var dir = userSortDir === "asc" ? 1 : -1;
            if (userSortKey === "type") {
                var aRank = (_a = orderMap.get(a.userType)) !== null && _a !== void 0 ? _a : 999;
                var bRank = (_b = orderMap.get(b.userType)) !== null && _b !== void 0 ? _b : 999;
                if (aRank !== bRank)
                    return (aRank - bRank) * dir;
            }
            if (userSortKey === "created") {
                var aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                var bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (aTime !== bTime)
                    return (aTime - bTime) * dir;
            }
            var aName = "".concat(a.firstName || "", " ").concat(a.lastName || "")
                .trim()
                .toLowerCase();
            var bName = "".concat(b.firstName || "", " ").concat(b.lastName || "")
                .trim()
                .toLowerCase();
            return aName.localeCompare(bName) * dir;
        });
        return normalized;
    }, [users, userSortDir, userSortKey]);
    var filteredUsers = useMemo(function () {
        var search = userSearch.trim().toLowerCase();
        return sortedUsers.filter(function (user) {
            if (userTypeFilter !== "all" && user.userType !== userTypeFilter) {
                return false;
            }
            if (!search)
                return true;
            var name = "".concat(user.firstName || "", " ").concat(user.lastName || "")
                .trim()
                .toLowerCase();
            var email = "".concat(user.email || "").toLowerCase();
            var phone = "".concat(user.phone || "").toLowerCase();
            return (name.includes(search) ||
                email.includes(search) ||
                phone.includes(search));
        });
    }, [sortedUsers, userSearch, userTypeFilter]);
    useEffect(function () {
        if (!selectedUser) {
            setUserEdits(null);
            return;
        }
        setUserEdits({
            email: selectedUser.email || "",
            firstName: selectedUser.firstName || "",
            lastName: selectedUser.lastName || "",
            phone: selectedUser.phone || "",
            postalCode: selectedUser.postalCode || "",
            birthYear: selectedUser.birthYear || "",
            gender: selectedUser.gender || "",
            isActive: !selectedUser.isDisabled,
            emailVerified: !!selectedUser.emailVerified,
            userType: selectedUser.userType || "customer",
        });
    }, [selectedUser]);
    useEffect(function () {
        if (!parkingPasses.length) {
            setParkingPassEdits({});
            return;
        }
        var nextEdits = {};
        parkingPasses.forEach(function (pass) {
            var _a, _b, _c, _d, _e, _f;
            nextEdits[pass.id] = {
                startTime: pass.startTime || "",
                endTime: pass.endTime || "",
                maxTrucks: (_a = pass.maxTrucks) !== null && _a !== void 0 ? _a : 1,
                status: pass.status || "open",
                breakfastPriceCents: (_b = pass.breakfastPriceCents) !== null && _b !== void 0 ? _b : 0,
                lunchPriceCents: (_c = pass.lunchPriceCents) !== null && _c !== void 0 ? _c : 0,
                dinnerPriceCents: (_d = pass.dinnerPriceCents) !== null && _d !== void 0 ? _d : 0,
                dailyPriceCents: (_e = pass.dailyPriceCents) !== null && _e !== void 0 ? _e : 0,
                weeklyPriceCents: (_f = pass.weeklyPriceCents) !== null && _f !== void 0 ? _f : 0,
            };
        });
        setParkingPassEdits(nextEdits);
    }, [parkingPasses]);
    useEffect(function () {
        if (!userAddresses.length) {
            setAddressEdits({});
            return;
        }
        var nextEdits = {};
        userAddresses.forEach(function (address) {
            nextEdits[address.id] = {
                label: address.label || "",
                address: address.address || "",
                city: address.city || "",
                state: address.state || "",
                postalCode: address.postalCode || "",
                type: address.type || "other",
                isDefault: !!address.isDefault,
            };
        });
        setAddressEdits(nextEdits);
    }, [userAddresses]);
    useEffect(function () {
        if (!userHosts.length) {
            setHostEdits({});
            return;
        }
        var nextEdits = {};
        userHosts.forEach(function (host) {
            var _a;
            nextEdits[host.id] = {
                businessName: host.businessName || "",
                address: host.address || "",
                city: host.city || "",
                state: host.state || "",
                latitude: host.latitude || "",
                longitude: host.longitude || "",
                locationType: host.locationType || "other",
                expectedFootTraffic: (_a = host.expectedFootTraffic) !== null && _a !== void 0 ? _a : "",
                contactPhone: host.contactPhone || "",
                notes: host.notes || "",
                isVerified: !!host.isVerified,
                amenitiesText: host.amenities ? JSON.stringify(host.amenities) : "",
            };
        });
        setHostEdits(nextEdits);
    }, [userHosts]);
    useEffect(function () {
        if (!userRestaurants.length) {
            setRestaurantEdits({});
            return;
        }
        var nextEdits = {};
        userRestaurants.forEach(function (restaurant) {
            nextEdits[restaurant.id] = {
                name: restaurant.name || "",
                address: restaurant.address || "",
                phone: restaurant.phone || "",
                businessType: restaurant.businessType || "restaurant",
                cuisineType: restaurant.cuisineType || "",
                promoCode: restaurant.promoCode || "",
                city: restaurant.city || "",
                state: restaurant.state || "",
                latitude: restaurant.latitude || "",
                longitude: restaurant.longitude || "",
                description: restaurant.description || "",
                websiteUrl: restaurant.websiteUrl || "",
                instagramUrl: restaurant.instagramUrl || "",
                facebookPageUrl: restaurant.facebookPageUrl || "",
                isActive: !!restaurant.isActive,
                isVerified: !!restaurant.isVerified,
                amenitiesText: restaurant.amenities
                    ? JSON.stringify(restaurant.amenities)
                    : "",
            };
        });
        setRestaurantEdits(nextEdits);
    }, [userRestaurants]);
    useEffect(function () {
        if (!userDeals.length) {
            setDealEdits({});
            return;
        }
        var nextEdits = {};
        userDeals.forEach(function (deal) {
            var _a, _b, _c, _d;
            nextEdits[deal.id] = {
                title: deal.title || "",
                description: deal.description || "",
                dealType: deal.dealType || "percentage",
                discountValue: (_a = deal.discountValue) !== null && _a !== void 0 ? _a : "",
                minOrderAmount: (_b = deal.minOrderAmount) !== null && _b !== void 0 ? _b : "",
                imageUrl: deal.imageUrl || "",
                startDate: deal.startDate ? deal.startDate.slice(0, 10) : "",
                endDate: deal.endDate ? deal.endDate.slice(0, 10) : "",
                startTime: deal.startTime || "",
                endTime: deal.endTime || "",
                availableDuringBusinessHours: !!deal.availableDuringBusinessHours,
                isOngoing: !!deal.isOngoing,
                totalUsesLimit: (_c = deal.totalUsesLimit) !== null && _c !== void 0 ? _c : "",
                perCustomerLimit: (_d = deal.perCustomerLimit) !== null && _d !== void 0 ? _d : "",
                isActive: !!deal.isActive,
            };
        });
        setDealEdits(nextEdits);
    }, [userDeals]);
    useEffect(function () {
        if (!userEvents.length) {
            setEventEdits({});
            return;
        }
        var nextEdits = {};
        userEvents.forEach(function (event) {
            var _a, _b, _c, _d;
            nextEdits[event.id] = {
                name: event.name || "",
                description: event.description || "",
                date: event.date ? event.date.slice(0, 10) : "",
                startTime: event.startTime || "",
                endTime: event.endTime || "",
                maxTrucks: (_a = event.maxTrucks) !== null && _a !== void 0 ? _a : 1,
                status: event.status || "open",
                hardCapEnabled: !!event.hardCapEnabled,
                requiresPayment: !!event.requiresPayment,
                breakfastPriceCents: (_b = event.breakfastPriceCents) !== null && _b !== void 0 ? _b : 0,
                lunchPriceCents: (_c = event.lunchPriceCents) !== null && _c !== void 0 ? _c : 0,
                dinnerPriceCents: (_d = event.dinnerPriceCents) !== null && _d !== void 0 ? _d : 0,
            };
        });
        setEventEdits(nextEdits);
    }, [userEvents]);
    useEffect(function () {
        if (!userEventSeries.length) {
            setSeriesEdits({});
            return;
        }
        var nextEdits = {};
        userEventSeries.forEach(function (series) {
            var _a;
            nextEdits[series.id] = {
                name: series.name || "",
                description: series.description || "",
                timezone: series.timezone || "America/New_York",
                recurrenceRule: series.recurrenceRule || "",
                startDate: series.startDate ? series.startDate.slice(0, 10) : "",
                endDate: series.endDate ? series.endDate.slice(0, 10) : "",
                defaultStartTime: series.defaultStartTime || "",
                defaultEndTime: series.defaultEndTime || "",
                defaultMaxTrucks: (_a = series.defaultMaxTrucks) !== null && _a !== void 0 ? _a : 1,
                defaultHardCapEnabled: !!series.defaultHardCapEnabled,
                status: series.status || "draft",
            };
        });
        setSeriesEdits(nextEdits);
    }, [userEventSeries]);
    useEffect(function () {
        var bookingRows = __spreadArray(__spreadArray([], ((userParkingBookings === null || userParkingBookings === void 0 ? void 0 : userParkingBookings.bookingsAsTruck) || []), true), ((userParkingBookings === null || userParkingBookings === void 0 ? void 0 : userParkingBookings.bookingsAsHost) || []), true);
        if (!bookingRows.length) {
            setBookingEdits({});
            return;
        }
        var nextEdits = {};
        bookingRows.forEach(function (row) {
            var _a;
            var booking = row.event_bookings || row;
            nextEdits[booking.id] = {
                status: booking.status || "pending",
                refundStatus: booking.refundStatus || "none",
                refundAmountCents: (_a = booking.refundAmountCents) !== null && _a !== void 0 ? _a : "",
                cancellationReason: booking.cancellationReason || "",
                refundReason: booking.refundReason || "",
            };
        });
        setBookingEdits(nextEdits);
    }, [userParkingBookings]);
    // Fetch selected deal's performance stats
    var dealStats = useQuery({
        queryKey: ["/api/admin/deals", selectedDeal === null || selectedDeal === void 0 ? void 0 : selectedDeal.id, "stats"],
        enabled: !!adminUser && !!(selectedDeal === null || selectedDeal === void 0 ? void 0 : selectedDeal.id) && dealDetailsOpen,
    }).data;
    // Fetch all deals
    var _9 = useQuery({
        queryKey: ["/api/admin/deals"],
        enabled: !!adminUser && selectedTab === "deals",
    }).data, deals = _9 === void 0 ? [] : _9;
    // Fetch verification requests
    var _10 = useQuery({
        queryKey: ["/api/admin/verifications"],
        enabled: !!adminUser && selectedTab === "verifications",
    }), _11 = _10.data, verificationRequests = _11 === void 0 ? [] : _11, loadingVerifications = _10.isLoading;
    // Approve restaurant mutation
    var approveRestaurant = useMutation({
        mutationFn: function (restaurantId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/restaurants/".concat(restaurantId, "/approve"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/restaurants/pending"],
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({
                title: "Restaurant Approved",
                description: "The restaurant has been activated successfully.",
            });
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to approve restaurant. Please try again.",
                variant: "destructive",
            });
        },
    });
    // Reject restaurant mutation
    var rejectRestaurant = useMutation({
        mutationFn: function (restaurantId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/admin/restaurants/".concat(restaurantId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/restaurants/pending"],
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({
                title: "Restaurant Rejected",
                description: "The restaurant application has been rejected.",
            });
        },
    });
    // Toggle deal featured status
    var toggleDealFeatured = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var dealId = _b.dealId, isFeatured = _b.isFeatured;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/deals/".concat(dealId, "/featured"), {
                            isFeatured: isFeatured,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
            toast({
                title: "Deal Updated",
                description: "Featured status has been updated.",
            });
        },
    });
    // Delete deal
    var deleteDeal = useMutation({
        mutationFn: function (dealId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/admin/deals/".concat(dealId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            setDealDetailsOpen(false);
            toast({
                title: "Deal Deleted",
                description: "The deal has been permanently deleted.",
            });
        },
    });
    // Clone deal
    var cloneDeal = useMutation({
        mutationFn: function (dealId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/deals/".concat(dealId, "/clone"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
            toast({
                title: "Deal Cloned",
                description: "A copy of the deal has been created (inactive).",
            });
        },
    });
    // Toggle deal active status
    var toggleDealStatus = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var dealId = _b.dealId, isActive = _b.isActive;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/deals/".concat(dealId, "/status"), {
                            isActive: isActive,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({
                title: "Deal Status Updated",
                description: "The deal has been activated/deactivated.",
            });
        },
    });
    // Extend deal
    var extendDeal = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var dealId = _b.dealId, days = _b.days;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/deals/".concat(dealId, "/extend"), {
                            days: days,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
            setDealDetailsOpen(false);
            toast({
                title: "Deal Extended",
                description: "Deal extended by ".concat(extendDays, " days successfully."),
            });
        },
    });
    // Toggle user status
    var toggleUserStatus = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var userId = _b.userId, isActive = _b.isActive;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/users/".concat(userId, "/status"), {
                            isActive: isActive,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({
                title: "User Status Updated",
                description: "User account status has been updated.",
            });
        },
    });
    // Update user type
    var updateUserType = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var userId = _b.userId, userType = _b.userType;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/users/".concat(userId, "/type"), {
                            userType: userType,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({
                title: "User Type Updated",
                description: "User type has been changed successfully.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update user type.",
                variant: "destructive",
            });
        },
    });
    var resendVerificationEmail = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/".concat(userId, "/resend-verification"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Verification Sent",
                description: "Verification email has been resent.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to resend verification email.",
                variant: "destructive",
            });
        },
    });
    var verifyUserEmail = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/".concat(userId, "/verify"))];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({
                title: "User Verified",
                description: "Email verification marked as complete.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to verify user.",
                variant: "destructive",
            });
        },
    });
    var sendSubscriptionLink = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/".concat(userId, "/send-subscription-link"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Subscription Link Sent",
                description: "Monthly subscription link has been emailed.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to send subscription link.",
                variant: "destructive",
            });
        },
    });
    var updateUserInfo = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/users/".concat(payload.userId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (updatedUser) {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setSelectedUser(updatedUser);
            toast({
                title: "User Updated",
                description: "User information has been updated.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update user.",
                variant: "destructive",
            });
        },
    });
    var updateParkingPass = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/parking-pass/".concat(payload.eventId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "parking-pass"],
            });
            toast({
                title: "Parking Pass Updated",
                description: "Parking pass listing updated successfully.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update parking pass.",
                variant: "destructive",
            });
        },
    });
    var createAddress = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/".concat(payload.userId, "/addresses"), payload.data)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "addresses"],
            });
            setNewAddress({
                label: "",
                address: "",
                city: "",
                state: "",
                postalCode: "",
                type: "other",
                isDefault: false,
            });
            toast({ title: "Address Added" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to add address.",
                variant: "destructive",
            });
        },
    });
    var updateAddress = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/users/".concat(payload.userId, "/addresses/").concat(payload.addressId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "addresses"],
            });
            toast({ title: "Address Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update address.",
                variant: "destructive",
            });
        },
    });
    var deleteAddress = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/admin/users/".concat(payload.userId, "/addresses/").concat(payload.addressId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "addresses"],
            });
            toast({ title: "Address Deleted" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete address.",
                variant: "destructive",
            });
        },
    });
    var setDefaultAddress = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/".concat(payload.userId, "/addresses/").concat(payload.addressId, "/default"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "addresses"],
            });
            toast({ title: "Default Address Updated" });
        },
    });
    var updateHost = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/hosts/".concat(payload.hostId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "hosts"],
            });
            toast({ title: "Host Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update host.",
                variant: "destructive",
            });
        },
    });
    var createHostLocation = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/users/".concat(payload.userId, "/hosts"), payload.data)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "hosts"],
            });
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "parking-pass"],
            });
            setNewHostLocation({
                businessName: "",
                address: "",
                city: "",
                state: "",
                locationType: "other",
                expectedFootTraffic: "",
                contactPhone: "",
                notes: "",
            });
            toast({ title: "Host Location Added" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to add host location.",
                variant: "destructive",
            });
        },
    });
    var deleteHostLocation = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/admin/hosts/".concat(payload.hostId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "hosts"],
            });
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "parking-pass"],
            });
            toast({ title: "Host Location Deleted" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete host location.",
                variant: "destructive",
            });
        },
    });
    var updateRestaurant = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/restaurants/".concat(payload.restaurantId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "restaurants"],
            });
            toast({ title: "Restaurant Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update restaurant.",
                variant: "destructive",
            });
        },
    });
    var updateDeal = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/deals/".concat(payload.dealId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "deals"],
            });
            toast({ title: "Deal Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update deal.",
                variant: "destructive",
            });
        },
    });
    var updateEvent = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/events/".concat(payload.eventId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "events"],
            });
            toast({ title: "Event Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update event.",
                variant: "destructive",
            });
        },
    });
    var updateEventSeries = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/event-series/".concat(payload.seriesId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "event-series"],
            });
            toast({ title: "Open Call Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update open call.",
                variant: "destructive",
            });
        },
    });
    var updateBooking = useMutation({
        mutationFn: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/admin/parking-pass-bookings/".concat(payload.bookingId), payload.updates)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/admin/users", selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.id, "parking-pass-bookings"],
            });
            toast({ title: "Booking Updated" });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update booking.",
                variant: "destructive",
            });
        },
    });
    // Delete user
    var deleteUser = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/admin/users/".concat(userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setUserDetailsOpen(false);
            toast({
                title: "User Deleted",
                description: "User account has been permanently deleted.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete user.",
                variant: "destructive",
            });
        },
    });
    // Delete user (super admin only)
    var deleteUserPermanently = useMutation({
        mutationFn: function (userId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/admin/users/".concat(userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setUserDetailsOpen(false);
            toast({
                title: "User Deleted",
                description: "User has been permanently deleted.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message ||
                    "Failed to delete user. You may need super admin permissions.",
                variant: "destructive",
            });
        },
    });
    // Approve verification request
    var approveVerification = useMutation({
        mutationFn: function (requestId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/verifications/".concat(requestId, "/approve"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({
                title: "Verification Approved",
                description: "Restaurant verification has been approved successfully.",
            });
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to approve verification. Please try again.",
                variant: "destructive",
            });
        },
    });
    // Reject verification request
    var rejectVerification = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var requestId = _b.requestId, reason = _b.reason;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/admin/verifications/".concat(requestId, "/reject"), { reason: reason })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({
                title: "Verification Rejected",
                description: "Restaurant verification has been rejected.",
            });
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to reject verification. Please try again.",
                variant: "destructive",
            });
        },
    });
    if (isAuthLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (!adminUser) {
        return (<div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-destructive"/>
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);
    }
    var defaultStats = {
        totalUsers: 0,
        totalRestaurants: 0,
        totalDeals: 0,
        activeDeals: 0,
        totalClaims: 0,
        todayClaims: 0,
        revenue: 0,
        newUsersToday: 0,
    };
    var dashboardStats = stats || defaultStats;
    var toDollars = function (value) {
        var parsed = Number(value);
        if (!Number.isFinite(parsed))
            return 0;
        return parsed / 100;
    };
    var toCents = function (value) {
        var parsed = Number(value);
        if (!Number.isFinite(parsed))
            return 0;
        return Math.round(parsed * 100);
    };
    return (<div className="admin-dashboard max-w-7xl mx-auto min-h-screen bg-[var(--bg-app)] pb-20">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-6 bg-[hsl(var(--background))] border-b border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary"/>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage your MealScout platform
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout-admin">
            Logout
          </Button>
        </div>
      </header>

      {/* Dashboard Switcher */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <QuickDashboardAccess />
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.totalUsers}
                </div>
                <Users className="w-5 h-5 text-primary"/>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{dashboardStats.newUsersToday} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.totalRestaurants}
                </div>
                <Store className="w-5 h-5 text-primary"/>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingRestaurants.length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.activeDeals}
                </div>
                <Package className="w-5 h-5 text-primary"/>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {dashboardStats.totalDeals} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Claims Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.todayClaims}
                </div>
                <Activity className="w-5 h-5 text-primary"/>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardStats.totalClaims} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full inline-flex h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="overview" data-testid="tab-overview" className="flex-shrink-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="tab-restaurants" className="flex-shrink-0">
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="flex-shrink-0">
              Users
            </TabsTrigger>
            <TabsTrigger value="staff" data-testid="tab-staff" className="flex-shrink-0">
              Staff
            </TabsTrigger>
            <TabsTrigger value="deals" data-testid="tab-deals" className="flex-shrink-0">
              Deals
            </TabsTrigger>
            <TabsTrigger value="verifications" data-testid="tab-verifications" className="flex-shrink-0">
              Verifications
            </TabsTrigger>
            <TabsTrigger value="onboarding" data-testid="tab-onboarding" className="flex-shrink-0">
              Manual Onboarding
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600"/>
                    <span className="font-medium">System Status</span>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Conversion Rate
                    </div>
                    <div className="text-xl font-bold">
                      {dashboardStats.totalClaims > 0
            ? ((dashboardStats.todayClaims /
                dashboardStats.totalClaims) *
                100).toFixed(1)
            : "0"}
                      %
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Monthly Revenue
                    </div>
                    <div className="text-xl font-bold">
                      {(function () {
            var _a;
            var revenue = Number((_a = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.revenue) !== null && _a !== void 0 ? _a : 0);
            return "$".concat(revenue.toFixed(2));
        })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Restaurant Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRestaurants.length === 0 ? (<p className="text-muted-foreground text-center py-4">
                    No pending approvals
                  </p>) : (<div className="space-y-3">
                    {pendingRestaurants.map(function (restaurant) { return (<div key={restaurant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {restaurant.cuisineType} • {restaurant.email}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="default" onClick={function () {
                    return approveRestaurant.mutate(restaurant.id);
                }} disabled={approveRestaurant.isPending} data-testid={"button-approve-".concat(restaurant.id)}>
                            <CheckCircle className="w-4 h-4 mr-1"/>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={function () {
                    return rejectRestaurant.mutate(restaurant.id);
                }} disabled={rejectRestaurant.isPending} data-testid={"button-reject-".concat(restaurant.id)}>
                            <XCircle className="w-4 h-4 mr-1"/>
                            Reject
                          </Button>
                        </div>
                      </div>); })}
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Sorting affects the full user list.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input value={userSearch} onChange={function (e) { return setUserSearch(e.target.value); }} placeholder="Search name, email, phone" className="text-xs px-2 py-1 border rounded-md bg-background"/>
                    <select value={userTypeFilter} onChange={function (e) { return setUserTypeFilter(e.target.value); }} className="text-xs px-2 py-1 border rounded-md bg-background">
                      <option value="all">All Types</option>
                      <option value="customer">Customer</option>
                      <option value="food_truck">Food Truck</option>
                      <option value="restaurant_owner">Restaurant Owner</option>
                      <option value="host">Host</option>
                      <option value="event_coordinator">Event Coordinator</option>
                      <option value="staff">Staff</option>
                      {((adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "admin" ||
            (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin") && (<option value="admin">Admin</option>)}
                      {(adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin" && (<option value="super_admin">Super Admin</option>)}
                    </select>
                    <select value={userSortKey} onChange={function (e) {
            return setUserSortKey(e.target.value);
        }} className="text-xs px-2 py-1 border rounded-md bg-background">
                      <option value="type">Sort by Type</option>
                      <option value="name">Sort by Name</option>
                      <option value="created">Sort by Created</option>
                    </select>
                    <select value={userSortDir} onChange={function (e) {
            return setUserSortDir(e.target.value);
        }} className="text-xs px-2 py-1 border rounded-md bg-background">
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3 mt-3">
                  {filteredUsers.map(function (user) { return (<div key={user.id} className="flex flex-col gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="w-3 h-3"/>
                          {user.email}
                        </div>
                        {user.phone && (<div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Phone className="w-3 h-3"/>
                            {user.phone}
                          </div>)}
                        {user.postalCode && (<div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3"/>
                            {user.postalCode}
                          </div>)}
                      </div>
                      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex flex-col gap-2">
                          <select value={user.userType} onChange={function (e) {
                return updateUserType.mutate({
                    userId: user.id,
                    userType: e.target.value,
                });
            }} className="text-xs px-2 py-1 border rounded-md" disabled={updateUserType.isPending || isStaff}>
                            <option value="customer">Customer</option>
                            <option value="food_truck">Food Truck</option>
                            <option value="restaurant_owner">
                              Restaurant Owner
                            </option>
                            <option value="host">Host</option>
                            <option value="event_coordinator">
                              Event Coordinator
                            </option>
                            <option value="staff">Staff</option>
                            {((adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "admin" ||
                (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin") && (<option value="admin">Admin</option>)}
                            {(adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin" && (<option value="super_admin">Super Admin</option>)}
                          </select>
                          <Button size="sm" variant="outline" onClick={function () { return resendVerificationEmail.mutate(user.id); }} disabled={resendVerificationEmail.isPending ||
                isStaff ||
                !user.email ||
                user.emailVerified} data-testid={"button-resend-verify-".concat(user.id)}>
                            <Mail className="w-3 h-3 mr-1"/>
                            {user.emailVerified ? "Verified" : "Resend Verify"}
                          </Button>
                          {isAdminOrSuper && !user.emailVerified && (<Button size="sm" variant="outline" onClick={function () { return verifyUserEmail.mutate(user.id); }} disabled={verifyUserEmail.isPending} data-testid={"button-verify-user-".concat(user.id)}>
                              <CheckCircle className="w-3 h-3 mr-1"/>
                              Auto Verify
                            </Button>)}
                          <Button size="sm" variant="outline" onClick={function () { return sendSubscriptionLink.mutate(user.id); }} disabled={sendSubscriptionLink.isPending ||
                isStaff ||
                !user.email ||
                !["restaurant_owner", "food_truck"].includes(user.userType)} data-testid={"button-send-subscription-".concat(user.id)}>
                            <DollarSign className="w-3 h-3 mr-1"/>
                            Send Monthly Link
                          </Button>
                        </div>
                        <Button size="sm" variant="outline" onClick={function () {
                setSelectedUser(user);
                setUserDetailsOpen(true);
            }} data-testid={"button-view-user-".concat(user.id)}>
                          <Eye className="w-4 h-4 mr-1"/>
                          Details
                        </Button>
                        {!isStaff && (<div className="flex items-center gap-2">
                            <Switch checked={!user.isDisabled} onCheckedChange={function (checked) {
                    return toggleUserStatus.mutate({
                        userId: user.id,
                        isActive: checked,
                    });
                }} data-testid={"switch-user-".concat(user.id)}/>
                            <Button size="sm" variant="destructive" onClick={function () {
                    if (confirm("Are you sure you want to permanently delete ".concat(user.firstName, " ").concat(user.lastName, "? This cannot be undone."))) {
                        deleteUser.mutate(user.id);
                    }
                }} disabled={deleteUser.isPending}>
                              <UserMinus className="w-4 h-4"/>
                            </Button>
                          </div>)}
                      </div>
                    </div>); })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab (Admin Only) */}
          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Promote users to staff role or remove staff access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffManagementTab />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Management</CardTitle>
                <CardDescription>
                  View, edit, and manage all deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deals.map(function (deal) {
            var _a;
            return (<div key={deal.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-lg">
                            {deal.title}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {(_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.name} • {deal.discountValue}% off
                            • Ends {new Date(deal.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={deal.isActive ? "default" : "secondary"}>
                            {deal.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {deal.isFeatured && (<Badge variant="outline">Featured</Badge>)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4"/>
                            {deal.currentUses || 0} uses
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4"/>
                            {deal.startTime} - {deal.endTime}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={function () {
                    setSelectedDeal(deal);
                    setDealDetailsOpen(true);
                }} data-testid={"button-view-deal-".concat(deal.id)}>
                            <Eye className="w-4 h-4 mr-1"/>
                            Details
                          </Button>

                          <Link href={"/deal-edit/".concat(deal.id)}>
                            <Button size="sm" variant="outline" data-testid={"button-edit-deal-".concat(deal.id)}>
                              <Settings className="w-4 h-4 mr-1"/>
                              Edit
                            </Button>
                          </Link>

                          <Button size="sm" variant="outline" onClick={function () { return cloneDeal.mutate(deal.id); }} disabled={cloneDeal.isPending} data-testid={"button-clone-deal-".concat(deal.id)}>
                            <Package className="w-4 h-4 mr-1"/>
                            Clone
                          </Button>

                          <Switch checked={deal.isActive} onCheckedChange={function (checked) {
                    return toggleDealStatus.mutate({
                        dealId: deal.id,
                        isActive: checked,
                    });
                }} data-testid={"switch-deal-active-".concat(deal.id)}/>

                          <Button size="sm" variant="destructive" onClick={function () {
                    if (window.confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
                        deleteDeal.mutate(deal.id);
                    }
                }} disabled={deleteDeal.isPending} data-testid={"button-delete-deal-".concat(deal.id)}>
                            <XCircle className="w-4 h-4"/>
                          </Button>
                        </div>
                      </div>
                    </div>);
        })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5"/>
                  <span>Business Verification Requests</span>
                </CardTitle>
                <CardDescription>
                  Review and approve restaurant verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (<div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
                  </div>) : verificationRequests.length === 0 ? (<div className="text-center p-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                    <p>No verification requests found</p>
                  </div>) : (<div className="space-y-4">
                    {verificationRequests.map(function (request) {
                var _a, _b;
                return (<div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {(_a = request.restaurant) === null || _a === void 0 ? void 0 : _a.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {(_b = request.restaurant) === null || _b === void 0 ? void 0 : _b.address}
                            </p>
                          </div>
                          <Badge variant={request.status === "pending"
                        ? "secondary"
                        : request.status === "approved"
                            ? "default"
                            : "destructive"} className="flex items-center space-x-1">
                            {request.status === "pending" && (<Clock className="w-3 h-3"/>)}
                            {request.status === "approved" && (<CheckCircle className="w-3 h-3"/>)}
                            {request.status === "rejected" && (<XCircle className="w-3 h-3"/>)}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Submitted:{" "}
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          {request.documents &&
                        request.documents.length > 0 && (<div>
                                <p className="text-sm font-medium mb-2">
                                  Documents ({request.documents.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {request.documents.map(function (doc, index) { return (<div key={index} className="relative">
                                        {doc.startsWith("data:image") ? (<img src={doc} alt={"Document ".concat(index + 1)} className="w-20 h-20 object-cover rounded cursor-pointer border" onClick={function () {
                                    return window.open(doc, "_blank");
                                }} data-testid={"img-document-".concat(request.id, "-").concat(index)}/>) : (<div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center cursor-pointer border" onClick={function () {
                                    return window.open(doc, "_blank");
                                }} data-testid={"doc-document-".concat(request.id, "-").concat(index)}>
                                            <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                                          </div>)}
                                      </div>); })}
                                </div>
                              </div>)}
                        </div>

                        {request.rejectionReason && (<div className="mb-4 p-3 bg-destructive/10 rounded-md">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-destructive">
                              {request.rejectionReason}
                            </p>
                          </div>)}

                        {request.status === "pending" && (<div className="flex items-center space-x-2">
                            <Button size="sm" variant="default" onClick={function () {
                            return approveVerification.mutate(request.id);
                        }} disabled={approveVerification.isPending} data-testid={"button-approve-verification-".concat(request.id)} className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4"/>
                              <span>Approve</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={function () {
                            var reason = window.prompt("Please provide a reason for rejection:");
                            if (reason && reason.trim()) {
                                rejectVerification.mutate({
                                    requestId: request.id,
                                    reason: reason.trim(),
                                });
                            }
                        }} disabled={rejectVerification.isPending} data-testid={"button-reject-verification-".concat(request.id)} className="flex items-center space-x-1">
                              <XCircle className="w-4 h-4"/>
                              <span>Reject</span>
                            </Button>
                          </div>)}
                      </div>);
            })}
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Create User Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5"/>
                    Create Account
                  </CardTitle>
                  <CardDescription>
                    Manually onboard a new user, host, event coordinator,
                    restaurant owner, or staff member. We'll email a setup link
                    so they can finish their profile and set a password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ManualUserCreation adminUser={adminUser}/>
                </CardContent>
              </Card>

              <TruckImportPanel enabled={selectedTab === "onboarding"}/>
            </div>

            {/* Existing Hosts Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5"/>
                  Manage Host Locations
                </CardTitle>
                <CardDescription>
                  View and update geocoded locations for existing hosts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HostLocationManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="admin-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5"/>
              <span>User Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete profile information and activity details
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (<div className="space-y-6 mt-4">
              {/* Edit User */}
              {!isStaff && userEdits && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Settings className="w-4 h-4 mr-2"/>
                    EDIT USER
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <input type="email" className="w-full px-3 py-2 border rounded-md text-sm" value={userEdits.email} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { email: e.target.value }));
                }}/>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">User Type</p>
                      <select className="w-full px-3 py-2 border rounded-md text-sm bg-background" value={userEdits.userType} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { userType: e.target.value }));
                }}>
                        <option value="customer">Customer</option>
                        <option value="food_truck">Food Truck</option>
                        <option value="restaurant_owner">Restaurant Owner</option>
                        <option value="host">Host</option>
                        <option value="event_coordinator">Event Coordinator</option>
                        <option value="staff">Staff</option>
                        {((adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "admin" ||
                    (adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin") && (<option value="admin">Admin</option>)}
                        {(adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin" && (<option value="super_admin">Super Admin</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">First Name</p>
                      <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={userEdits.firstName} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { firstName: e.target.value }));
                }}/>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Name</p>
                      <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={userEdits.lastName} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { lastName: e.target.value }));
                }}/>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={userEdits.phone} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { phone: e.target.value }));
                }}/>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Postal Code</p>
                      <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={userEdits.postalCode} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { postalCode: e.target.value }));
                }}/>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Birth Year</p>
                      <input type="number" className="w-full px-3 py-2 border rounded-md text-sm" value={userEdits.birthYear} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { birthYear: e.target.value }));
                }}/>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <select className="w-full px-3 py-2 border rounded-md text-sm bg-background" value={userEdits.gender} onChange={function (e) {
                    return setUserEdits(__assign(__assign({}, userEdits), { gender: e.target.value }));
                }}>
                        <option value="">Unspecified</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">
                        Active
                      </label>
                      <Switch checked={!!userEdits.isActive} onCheckedChange={function (checked) {
                    return setUserEdits(__assign(__assign({}, userEdits), { isActive: checked }));
                }}/>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">
                        Email Verified
                      </label>
                      <Switch checked={!!userEdits.emailVerified} onCheckedChange={function (checked) {
                    return setUserEdits(__assign(__assign({}, userEdits), { emailVerified: checked }));
                }}/>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" onClick={function () {
                    return updateUserInfo.mutate({
                        userId: selectedUser.id,
                        updates: userEdits,
                    });
                }} disabled={updateUserInfo.isPending || isStaff} data-testid="button-save-user">
                      Save User Changes
                    </Button>
                  </div>
                </div>)}
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2"/>
                  BASIC INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">User Type</p>
                    <Badge variant={selectedUser.userType === "admin"
                ? "destructive"
                : "secondary"}>
                      {selectedUser.userType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3"/>
                      {selectedUser.email}
                    </p>
                  </div>
                  {selectedUser.phone && (<div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3"/>
                        {selectedUser.phone}
                      </p>
                    </div>)}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Email Verified
                    </p>
                    <Badge variant={selectedUser.emailVerified ? "default" : "secondary"}>
                      {selectedUser.emailVerified ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Account Status
                    </p>
                    <Badge variant={!selectedUser.isDisabled ? "default" : "destructive"}>
                      {!selectedUser.isDisabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Location & Demographics */}
              {(selectedUser.postalCode ||
                selectedUser.birthYear ||
                selectedUser.gender) && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2"/>
                    LOCATION & DEMOGRAPHICS
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.postalCode && (<div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Postal Code
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3"/>
                          {selectedUser.postalCode}
                        </p>
                      </div>)}
                    {selectedUser.birthYear && (<div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Birth Year
                        </p>
                        <p className="text-sm">{selectedUser.birthYear}</p>
                      </div>)}
                    {selectedUser.gender && (<div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm capitalize">
                          {selectedUser.gender}
                        </p>
                      </div>)}
                  </div>
                </div>)}

              {/* Subscription Information */}
              {(selectedUser.stripeCustomerId ||
                selectedUser.stripeSubscriptionId) && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4 mr-2"/>
                    SUBSCRIPTION
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.stripeCustomerId && (<div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Stripe Customer ID
                        </p>
                        <p className="text-sm font-mono text-xs">
                          {selectedUser.stripeCustomerId}
                        </p>
                      </div>)}
                    {selectedUser.stripeSubscriptionId && (<div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Subscription ID
                        </p>
                        <p className="text-sm font-mono text-xs">
                          {selectedUser.stripeSubscriptionId}
                        </p>
                      </div>)}
                    {selectedUser.subscriptionBillingInterval && (<div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Billing Interval
                        </p>
                        <Badge variant="outline">
                          {selectedUser.subscriptionBillingInterval}
                        </Badge>
                      </div>)}
                  </div>
                </div>)}

              {/* Authentication Methods */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 mr-2"/>
                  AUTHENTICATION METHODS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.googleId && (<Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3"/>
                      Google OAuth
                    </Badge>)}
                  {selectedUser.facebookId && (<Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3"/>
                      Facebook OAuth
                    </Badge>)}
                  {selectedUser.passwordHash && (<Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3"/>
                      Email/Password
                    </Badge>)}
                </div>
              </div>

              {/* Account Activity */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2"/>
                  ACCOUNT ACTIVITY
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Account Created
                    </p>
                    <p className="text-sm">
                      {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })}
                    </p>
                  </div>
                  {selectedUser.updatedAt && (<div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="text-sm">
                        {new Date(selectedUser.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
                      </p>
                    </div>)}
                </div>
              </div>

              {/* Saved Addresses */}
              {(selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.userType) !== "host" && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2"/>
                    SAVED ADDRESSES ({userAddresses.length})
                  </h3>
                  <div className="space-y-3">
                    {userAddresses.map(function (address) {
                    var edits = addressEdits[address.id];
                    if (!edits)
                        return null;
                    return (<div key={address.id} className="border rounded-lg p-3 bg-muted/30 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {address.type}
                              </Badge>
                              {address.isDefault && (<Badge variant="default" className="text-xs">
                                  Default
                                </Badge>)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={function () {
                            return setDefaultAddress.mutate({
                                userId: selectedUser.id,
                                addressId: address.id,
                            });
                        }} disabled={isStaff}>
                                Set Default
                              </Button>
                              <Button size="sm" variant="destructive" onClick={function () {
                            return deleteAddress.mutate({
                                userId: selectedUser.id,
                                addressId: address.id,
                            });
                        }} disabled={isStaff}>
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Label" value={edits.label} onChange={function (e) {
                            var _a;
                            return setAddressEdits(__assign(__assign({}, addressEdits), (_a = {}, _a[address.id] = __assign(__assign({}, edits), { label: e.target.value }), _a)));
                        }}/>
                            <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={edits.type} onChange={function (e) {
                            var _a;
                            return setAddressEdits(__assign(__assign({}, addressEdits), (_a = {}, _a[address.id] = __assign(__assign({}, edits), { type: e.target.value }), _a)));
                        }}>
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Address" value={edits.address} onChange={function (e) {
                            var _a;
                            return setAddressEdits(__assign(__assign({}, addressEdits), (_a = {}, _a[address.id] = __assign(__assign({}, edits), { address: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="City" value={edits.city} onChange={function (e) {
                            var _a;
                            return setAddressEdits(__assign(__assign({}, addressEdits), (_a = {}, _a[address.id] = __assign(__assign({}, edits), { city: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="State" value={edits.state} onChange={function (e) {
                            var _a;
                            return setAddressEdits(__assign(__assign({}, addressEdits), (_a = {}, _a[address.id] = __assign(__assign({}, edits), { state: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Postal Code" value={edits.postalCode} onChange={function (e) {
                            var _a;
                            return setAddressEdits(__assign(__assign({}, addressEdits), (_a = {}, _a[address.id] = __assign(__assign({}, edits), { postalCode: e.target.value }), _a)));
                        }}/>
                          </div>
                          <div>
                            <Button size="sm" variant="outline" onClick={function () {
                            return updateAddress.mutate({
                                userId: selectedUser.id,
                                addressId: address.id,
                                updates: edits,
                            });
                        }} disabled={isStaff}>
                              Save Address
                            </Button>
                          </div>
                        </div>);
                })}
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="text-sm font-medium">Add New Address</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Label" value={newAddress.label} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { label: e.target.value }));
                }}/>
                        <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={newAddress.type} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { type: e.target.value }));
                }}>
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Address" value={newAddress.address} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { address: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="City" value={newAddress.city} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { city: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="State" value={newAddress.state} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { state: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Postal Code" value={newAddress.postalCode} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { postalCode: e.target.value }));
                }}/>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={newAddress.isDefault} onChange={function (e) {
                    return setNewAddress(__assign(__assign({}, newAddress), { isDefault: e.target.checked }));
                }}/>
                        Set as default
                      </label>
                      <Button size="sm" onClick={function () {
                    return createAddress.mutate({
                        userId: selectedUser.id,
                        data: newAddress,
                    });
                }} disabled={createAddress.isPending || isStaff}>
                        Add Address
                      </Button>
                    </div>
                  </div>
                </div>)}

              {/* Host Profiles */}
              {((selectedUser === null || selectedUser === void 0 ? void 0 : selectedUser.userType) === "host" || userHosts.length > 0) && (<div>
                  <h3 className="font-semibold mb-2 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2"/>
                    HOST LOCATIONS (PARKING PASS) ({userHosts.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    These addresses power Parking Pass listings. Edit here to
                    update them everywhere.
                  </p>
                  <div className="space-y-4">
                    {userHosts.length === 0 && (<div className="text-sm text-muted-foreground">
                        No host locations yet.
                      </div>)}
                    {userHosts.map(function (host) {
                    var edits = hostEdits[host.id];
                    if (!edits)
                        return null;
                    var pass = parkingPasses.find(function (item) { var _a, _b; return ((_b = (_a = item.host) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : item.hostId) === host.id; });
                    var passEdits = pass ? parkingPassEdits[pass.id] : null;
                    return (<div key={host.id} className="border rounded-lg p-3 bg-muted/30 space-y-3">
                          <div className="text-sm font-medium">
                            {host.businessName}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className="w-full px-2 py-1 border rounded-md text-sm" value={edits.businessName} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { businessName: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" value={edits.address} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { address: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="City" value={edits.city} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { city: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="State" value={edits.state} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { state: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Latitude" value={edits.latitude} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { latitude: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Longitude" value={edits.longitude} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { longitude: e.target.value }), _a)));
                        }}/>
                            <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={edits.locationType} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { locationType: e.target.value }), _a)));
                        }}>
                              <option value="private_residence">
                                Private Residence
                              </option>
                              <option value="business">Business</option>
                              <option value="parking_lot">Parking Lot</option>
                              <option value="event_space">Event Space</option>
                              <option value="public_park">Public Park</option>
                              <option value="other">Other</option>
                            </select>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Foot Traffic" value={edits.expectedFootTraffic} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { expectedFootTraffic: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Contact Phone" value={edits.contactPhone} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { contactPhone: e.target.value }), _a)));
                        }}/>
                            <textarea className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2" placeholder="Amenities JSON" value={edits.amenitiesText} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { amenitiesText: e.target.value }), _a)));
                        }}/>
                            <textarea className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2" placeholder="Notes" value={edits.notes} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { notes: e.target.value }), _a)));
                        }}/>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type="checkbox" checked={edits.isVerified} onChange={function (e) {
                            var _a;
                            return setHostEdits(__assign(__assign({}, hostEdits), (_a = {}, _a[host.id] = __assign(__assign({}, edits), { isVerified: e.target.checked }), _a)));
                        }}/>
                              Verified
                            </label>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Parking Pass pricing
                            </p>
                            {pass && passEdits ? (<>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Start Time
                                    </p>
                                    <input type="time" className="w-full px-2 py-1 border rounded-md text-sm" value={passEdits.startTime} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { startTime: e.target.value }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      End Time
                                    </p>
                                    <input type="time" className="w-full px-2 py-1 border rounded-md text-sm" value={passEdits.endTime} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { endTime: e.target.value }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Max Trucks
                                    </p>
                                    <input type="number" min={1} className="w-full px-2 py-1 border rounded-md text-sm" value={passEdits.maxTrucks} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { maxTrucks: e.target.value }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Status
                                    </p>
                                    <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={passEdits.status} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { status: e.target.value }), _a)));
                            }}>
                                      <option value="open">Open</option>
                                      <option value="booked">Booked</option>
                                      <option value="cancelled">Cancelled</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Breakfast ($)
                                    </p>
                                    <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(passEdits.breakfastPriceCents)} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { breakfastPriceCents: toCents(e.target.value) }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Lunch ($)
                                    </p>
                                    <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(passEdits.lunchPriceCents)} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { lunchPriceCents: toCents(e.target.value) }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Dinner ($)
                                    </p>
                                    <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(passEdits.dinnerPriceCents)} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { dinnerPriceCents: toCents(e.target.value) }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Daily ($)
                                    </p>
                                    <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(passEdits.dailyPriceCents)} onChange={function (e) {
                                var _a;
                                return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, passEdits), { dailyPriceCents: toCents(e.target.value), weeklyPriceCents: toCents(e.target.value) * 7, monthlyPriceCents: toCents(e.target.value) * 30 }), _a)));
                            }}/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Weekly ($)
                                    </p>
                                    <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={Number(passEdits.dailyPriceCents || 0)
                                ? toDollars(Number(passEdits.dailyPriceCents || 0) * 7)
                                : toDollars(passEdits.weeklyPriceCents)} readOnly disabled/>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Monthly ($)
                                    </p>
                                    <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={Number(passEdits.dailyPriceCents || 0)
                                ? toDollars(Number(passEdits.dailyPriceCents || 0) * 30)
                                : toDollars(passEdits.monthlyPriceCents)} readOnly disabled/>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={function () {
                                return updateParkingPass.mutate({
                                    eventId: pass.id,
                                    updates: passEdits,
                                });
                            }} disabled={updateParkingPass.isPending || isStaff}>
                                  Save Parking Pass
                                </Button>
                              </>) : (<p className="text-xs text-muted-foreground">
                                No parking pass listing yet.
                              </p>)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm" variant="outline" onClick={function () {
                            var amenities = undefined;
                            if (edits.amenitiesText) {
                                try {
                                    amenities = JSON.parse(edits.amenitiesText);
                                }
                                catch (_a) {
                                    toast({
                                        title: "Invalid JSON",
                                        description: "Amenities must be valid JSON.",
                                        variant: "destructive",
                                    });
                                    return;
                                }
                            }
                            updateHost.mutate({
                                hostId: host.id,
                                updates: __assign(__assign({}, edits), { amenities: amenities }),
                            });
                        }} disabled={isStaff}>
                              Save Host
                            </Button>
                            <Button size="sm" variant="destructive" onClick={function () {
                            return deleteHostLocation.mutate({ hostId: host.id });
                        }} disabled={isStaff}>
                              Delete Location
                            </Button>
                          </div>
                        </div>);
                })}
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="text-sm font-medium">
                        Add Host Location
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Location name" value={newHostLocation.businessName} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { businessName: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Address" value={newHostLocation.address} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { address: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="City" value={newHostLocation.city} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { city: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="State" value={newHostLocation.state} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { state: e.target.value }));
                }}/>
                        <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={newHostLocation.locationType} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { locationType: e.target.value }));
                }}>
                          <option value="private_residence">
                            Private Residence
                          </option>
                          <option value="business">Business</option>
                          <option value="parking_lot">Parking Lot</option>
                          <option value="event_space">Event Space</option>
                          <option value="public_park">Public Park</option>
                          <option value="other">Other</option>
                        </select>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Foot Traffic" value={newHostLocation.expectedFootTraffic} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { expectedFootTraffic: e.target.value }));
                }}/>
                        <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Contact Phone" value={newHostLocation.contactPhone} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { contactPhone: e.target.value }));
                }}/>
                        <textarea className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2" placeholder="Notes" value={newHostLocation.notes} onChange={function (e) {
                    return setNewHostLocation(__assign(__assign({}, newHostLocation), { notes: e.target.value }));
                }}/>
                      </div>
                      <Button size="sm" onClick={function () {
                    if (!newHostLocation.businessName.trim() ||
                        !newHostLocation.address.trim()) {
                        toast({
                            title: "Missing fields",
                            description: "Location name and address are required.",
                            variant: "destructive",
                        });
                        return;
                    }
                    createHostLocation.mutate({
                        userId: selectedUser.id,
                        data: newHostLocation,
                    });
                }} disabled={createHostLocation.isPending || isStaff}>
                        Add Location
                      </Button>
                    </div>
                  </div>
                </div>)}

              {/* Restaurants */}
              {userRestaurants.length > 0 && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Store className="w-4 h-4 mr-2"/>
                    RESTAURANTS ({userRestaurants.length})
                  </h3>
                  <div className="space-y-4">
                    {userRestaurants.map(function (restaurant) {
                    var edits = restaurantEdits[restaurant.id];
                    if (!edits)
                        return null;
                    return (<div key={restaurant.id} className="border rounded-lg p-3 bg-muted/30 space-y-3">
                          <div className="text-sm font-medium">
                            {restaurant.name}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className="w-full px-2 py-1 border rounded-md text-sm" value={edits.name} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { name: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" value={edits.address} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { address: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Phone" value={edits.phone} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { phone: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Cuisine Type" value={edits.cuisineType} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { cuisineType: e.target.value }), _a)));
                        }}/>
                            <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={edits.businessType} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { businessType: e.target.value }), _a)));
                        }}>
                              <option value="restaurant">Restaurant</option>
                              <option value="bar">Bar</option>
                              <option value="food_truck">Food Truck</option>
                            </select>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Promo Code" value={edits.promoCode} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { promoCode: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="City" value={edits.city} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { city: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="State" value={edits.state} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { state: e.target.value }), _a)));
                        }}/>
                            <textarea className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2" placeholder="Description" value={edits.description} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { description: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Website URL" value={edits.websiteUrl} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { websiteUrl: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Instagram URL" value={edits.instagramUrl} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { instagramUrl: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Facebook Page URL" value={edits.facebookPageUrl} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { facebookPageUrl: e.target.value }), _a)));
                        }}/>
                            <textarea className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2" placeholder="Amenities JSON" value={edits.amenitiesText} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { amenitiesText: e.target.value }), _a)));
                        }}/>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type="checkbox" checked={edits.isActive} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { isActive: e.target.checked }), _a)));
                        }}/>
                              Active
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type="checkbox" checked={edits.isVerified} onChange={function (e) {
                            var _a;
                            return setRestaurantEdits(__assign(__assign({}, restaurantEdits), (_a = {}, _a[restaurant.id] = __assign(__assign({}, edits), { isVerified: e.target.checked }), _a)));
                        }}/>
                              Verified
                            </label>
                          </div>
                          <Button size="sm" variant="outline" onClick={function () {
                            var amenities = undefined;
                            if (edits.amenitiesText) {
                                try {
                                    amenities = JSON.parse(edits.amenitiesText);
                                }
                                catch (_a) {
                                    toast({
                                        title: "Invalid JSON",
                                        description: "Amenities must be valid JSON.",
                                        variant: "destructive",
                                    });
                                    return;
                                }
                            }
                            updateRestaurant.mutate({
                                restaurantId: restaurant.id,
                                updates: __assign(__assign({}, edits), { amenities: amenities }),
                            });
                        }} disabled={isStaff}>
                            Save Restaurant
                          </Button>
                        </div>);
                })}
                  </div>
                </div>)}

              {/* Deals */}
              {userDeals.length > 0 && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 mr-2"/>
                    DEALS ({userDeals.length})
                  </h3>
                  <div className="space-y-4">
                    {userDeals.map(function (deal) {
                    var edits = dealEdits[deal.id];
                    if (!edits)
                        return null;
                    return (<div key={deal.id} className="border rounded-lg p-3 bg-muted/30 space-y-3">
                          <div className="text-sm font-medium">
                            {deal.title}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className="w-full px-2 py-1 border rounded-md text-sm" value={edits.title} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { title: e.target.value }), _a)));
                        }}/>
                            <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={edits.dealType} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { dealType: e.target.value }), _a)));
                        }}>
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed</option>
                            </select>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Discount Value" value={edits.discountValue} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { discountValue: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Min Order Amount" value={edits.minOrderAmount} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { minOrderAmount: e.target.value }), _a)));
                        }}/>
                            <input className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Image URL" value={edits.imageUrl} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { imageUrl: e.target.value }), _a)));
                        }}/>
                            <input type="date" className="w-full px-2 py-1 border rounded-md text-sm" value={edits.startDate} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { startDate: e.target.value }), _a)));
                        }}/>
                            <input type="date" className="w-full px-2 py-1 border rounded-md text-sm" value={edits.endDate} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { endDate: e.target.value }), _a)));
                        }}/>
                            <input type="time" className="w-full px-2 py-1 border rounded-md text-sm" value={edits.startTime} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { startTime: e.target.value }), _a)));
                        }}/>
                            <input type="time" className="w-full px-2 py-1 border rounded-md text-sm" value={edits.endTime} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { endTime: e.target.value }), _a)));
                        }}/>
                            <textarea className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2" placeholder="Description" value={edits.description} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { description: e.target.value }), _a)));
                        }}/>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type="checkbox" checked={edits.availableDuringBusinessHours} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { availableDuringBusinessHours: e.target.checked }), _a)));
                        }}/>
                              Business Hours Only
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type="checkbox" checked={edits.isOngoing} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { isOngoing: e.target.checked }), _a)));
                        }}/>
                              Ongoing
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type="checkbox" checked={edits.isActive} onChange={function (e) {
                            var _a;
                            return setDealEdits(__assign(__assign({}, dealEdits), (_a = {}, _a[deal.id] = __assign(__assign({}, edits), { isActive: e.target.checked }), _a)));
                        }}/>
                              Active
                            </label>
                          </div>
                          <Button size="sm" variant="outline" onClick={function () {
                            return updateDeal.mutate({
                                dealId: deal.id,
                                updates: edits,
                            });
                        }} disabled={isStaff}>
                            Save Deal
                          </Button>
                        </div>);
                })}
                  </div>
                </div>)}

              {/* Profile Image */}
              {selectedUser.profileImageUrl && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2"/>
                    PROFILE IMAGE
                  </h3>
                  <img src={getOptimizedImageUrl(selectedUser.profileImageUrl, "large")} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2" data-testid="img-user-profile" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>
                </div>)}

              {/* Parking Pass Listings */}
              {parkingPasses.length > 0 && userHosts.length === 0 && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2"/>
                    PARKING PASS LISTINGS ({parkingPasses.length})
                  </h3>
                  <div className="space-y-4">
                    {parkingPasses.map(function (pass) {
                    var _a, _b, _c, _d;
                    var edits = parkingPassEdits[pass.id];
                    if (!edits)
                        return null;
                    var hostName = (_c = (_b = (_a = pass.host) === null || _a === void 0 ? void 0 : _a.businessName) !== null && _b !== void 0 ? _b : pass.name) !== null && _c !== void 0 ? _c : "Parking Pass";
                    var nextDate = (_d = pass.nextDate) !== null && _d !== void 0 ? _d : pass.date;
                    return (<div key={pass.id} className="border rounded-lg p-3 bg-muted/30 space-y-3">
                          <div className="text-sm font-medium">{hostName}</div>
                          <div className="text-xs text-muted-foreground">
                            Applies to all upcoming dates
                            {nextDate
                            ? " \u00B7 Next date ".concat(new Date(nextDate).toLocaleDateString())
                            : ""}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Start Time
                              </p>
                              <input type="time" className="w-full px-2 py-1 border rounded-md text-sm" value={edits.startTime} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { startTime: e.target.value }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                End Time
                              </p>
                              <input type="time" className="w-full px-2 py-1 border rounded-md text-sm" value={edits.endTime} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { endTime: e.target.value }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Max Trucks
                              </p>
                              <input type="number" min={1} className="w-full px-2 py-1 border rounded-md text-sm" value={edits.maxTrucks} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { maxTrucks: e.target.value }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Status
                              </p>
                              <select className="w-full px-2 py-1 border rounded-md text-sm bg-background" value={edits.status} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { status: e.target.value }), _a)));
                        }}>
                                <option value="open">Open</option>
                                <option value="booked">Booked</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Breakfast ($)
                              </p>
                              <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(edits.breakfastPriceCents)} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { breakfastPriceCents: toCents(e.target.value) }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Lunch ($)
                              </p>
                              <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(edits.lunchPriceCents)} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { lunchPriceCents: toCents(e.target.value) }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Dinner ($)
                              </p>
                              <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(edits.dinnerPriceCents)} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { dinnerPriceCents: toCents(e.target.value) }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Daily ($)
                              </p>
                              <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={toDollars(edits.dailyPriceCents)} onChange={function (e) {
                            var _a;
                            return setParkingPassEdits(__assign(__assign({}, parkingPassEdits), (_a = {}, _a[pass.id] = __assign(__assign({}, edits), { dailyPriceCents: toCents(e.target.value), weeklyPriceCents: toCents(e.target.value) * 7, monthlyPriceCents: toCents(e.target.value) * 30 }), _a)));
                        }}/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Weekly ($)
                              </p>
                              <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={Number(edits.dailyPriceCents || 0)
                            ? toDollars(Number(edits.dailyPriceCents || 0) * 7)
                            : toDollars(edits.weeklyPriceCents)} readOnly disabled/>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Monthly ($)
                              </p>
                              <input type="number" min={0} step={1} className="w-full px-2 py-1 border rounded-md text-sm" value={Number(edits.dailyPriceCents || 0)
                            ? toDollars(Number(edits.dailyPriceCents || 0) * 30)
                            : toDollars(edits.monthlyPriceCents)} readOnly disabled/>
                            </div>
                          </div>
                          <div>
                            <Button size="sm" variant="outline" onClick={function () {
                            return updateParkingPass.mutate({
                                eventId: pass.id,
                                updates: edits,
                            });
                        }} disabled={updateParkingPass.isPending || isStaff} data-testid={"button-save-parking-pass-".concat(pass.id)}>
                              Save Parking Pass
                            </Button>
                          </div>
                        </div>);
                })}
                  </div>
                </div>)}

              {/* Danger Zone - Super Admin Only */}
              {(adminUser === null || adminUser === void 0 ? void 0 : adminUser.userType) === "super_admin" && (<div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                  <h3 className="font-semibold mb-2 text-destructive flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2"/>
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete this user account. This action cannot be
                    undone and will remove all associated data.
                  </p>
                  <Button variant="destructive" size="sm" onClick={function () {
                    if (window.confirm("Are you absolutely sure you want to delete ".concat(selectedUser.email, "? This will permanently delete the account and all associated data. This action cannot be undone."))) {
                        deleteUser.mutate(selectedUser.id);
                    }
                }} disabled={deleteUser.isPending}>
                    <UserMinus className="w-4 h-4 mr-1"/>
                    Delete User Permanently
                  </Button>
                </div>)}
            </div>)}
        </DialogContent>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog open={dealDetailsOpen} onOpenChange={setDealDetailsOpen}>
        <DialogContent className="admin-dialog max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5"/>
              <span>Deal Details & Performance</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive information and analytics for this deal
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (<div className="space-y-6 mt-4">
              {/* Deal Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Package className="w-4 h-4 mr-2"/>
                  DEAL INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium text-lg">{selectedDeal.title}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedDeal.description}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Restaurant</p>
                    <p className="font-medium">
                      {(_a = selectedDeal.restaurant) === null || _a === void 0 ? void 0 : _a.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="font-medium">
                      {selectedDeal.discountValue}% off
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Validity Period
                    </p>
                    <p className="text-sm">
                      {new Date(selectedDeal.startDate).toLocaleDateString()} -{" "}
                      {new Date(selectedDeal.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Time Window</p>
                    <p className="text-sm">
                      {selectedDeal.startTime} - {selectedDeal.endTime}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedDeal.isActive ? "default" : "secondary"}>
                      {selectedDeal.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Featured</p>
                    <Badge variant={selectedDeal.isFeatured ? "default" : "outline"}>
                      {selectedDeal.isFeatured ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {selectedDeal.totalUsesLimit && (<div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Total Uses Limit
                      </p>
                      <p className="text-sm">
                        {selectedDeal.currentUses} /{" "}
                        {selectedDeal.totalUsesLimit}
                      </p>
                    </div>)}
                  {selectedDeal.perCustomerLimit && (<div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Per Customer Limit
                      </p>
                      <p className="text-sm">{selectedDeal.perCustomerLimit}</p>
                    </div>)}
                </div>
              </div>

              {/* Performance Metrics */}
              {dealStats && (<div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4 mr-2"/>
                    PERFORMANCE METRICS
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.views || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Views
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.claims || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Claims
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.views > 0
                    ? ((dealStats.claims / dealStats.views) *
                        100).toFixed(1)
                    : 0}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Conversion Rate
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {dealStats.averageRating > 0 && (<div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium">Average Rating</p>
                        <Badge variant="outline">
                          {dealStats.averageRating.toFixed(1)} / 5.0
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Based on {dealStats.totalFeedback} reviews
                      </div>
                    </div>)}
                </div>)}

              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Settings className="w-4 h-4 mr-2"/>
                  QUICK ACTIONS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Extend Deal Duration
                    </p>
                    <div className="flex gap-2">
                      <input type="number" min="1" value={extendDays} onChange={function (e) {
                return setExtendDays(parseInt(e.target.value) || 1);
            }} className="w-20 px-2 py-1 border rounded text-sm" placeholder="Days"/>
                      <Button size="sm" onClick={function () {
                return extendDeal.mutate({
                    dealId: selectedDeal.id,
                    days: extendDays,
                });
            }} disabled={extendDeal.isPending}>
                        Extend by {extendDays} days
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Deal Actions
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={function () {
                setDealDetailsOpen(false);
                window.location.href = "/deal-edit/".concat(selectedDeal.id);
            }}>
                        <Settings className="w-4 h-4 mr-1"/>
                        Edit Deal
                      </Button>
                      <Button size="sm" variant="outline" onClick={function () {
                cloneDeal.mutate(selectedDeal.id);
                setDealDetailsOpen(false);
            }} disabled={cloneDeal.isPending}>
                        <Package className="w-4 h-4 mr-1"/>
                        Clone
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2"/>
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete this deal. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" onClick={function () {
                if (window.confirm("Are you absolutely sure? This will permanently delete the deal and all associated data.")) {
                    deleteDeal.mutate(selectedDeal.id);
                }
            }} disabled={deleteDeal.isPending}>
                  <XCircle className="w-4 h-4 mr-1"/>
                  Delete Deal Permanently
                </Button>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>);
}
