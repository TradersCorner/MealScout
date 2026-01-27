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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
var locationTypeOptions = [
    { value: "office", label: "Office / Corporate" },
    { value: "bar", label: "Bar" },
    { value: "brewery", label: "Brewery" },
    { value: "campus", label: "Campus" },
    { value: "event", label: "Event Space" },
    { value: "other", label: "Other" },
];
function geocodeAddress(address) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!address)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(address), "&limit=1"), {
                            headers: { "Accept-Language": "en", "User-Agent": "MealScout/1.0" },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = (_a.sent());
                    if (!data.length)
                        return [2 /*return*/, null];
                    return [2 /*return*/, { lat: Number(data[0].lat), lng: Number(data[0].lon) }];
            }
        });
    });
}
function HostSignup() {
    var _this = this;
    var isAuthenticated = useAuth().isAuthenticated;
    var _a = useLocation(), setLocation = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var HOST_SIGNUP_DRAFT_KEY = "mealscout:host-signup-draft";
    // Form State
    var _c = useState(""), businessName = _c[0], setBusinessName = _c[1];
    var _d = useState(""), address = _d[0], setAddress = _d[1];
    var _e = useState(""), city = _e[0], setCity = _e[1];
    var _f = useState(""), state = _f[0], setState = _f[1];
    var _g = useState(""), contactName = _g[0], setContactName = _g[1];
    var _h = useState(""), contactEmail = _h[0], setContactEmail = _h[1];
    var _j = useState(""), contactPhone = _j[0], setContactPhone = _j[1];
    var _k = useState(""), locationType = _k[0], setLocationType = _k[1];
    var _l = useState(""), description = _l[0], setDescription = _l[1];
    var _m = useState({}), errors = _m[0], setErrors = _m[1];
    var _o = useState(false), isSubmitting = _o[0], setIsSubmitting = _o[1];
    useEffect(function () {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }
        // Load any saved draft once we know we're staying on this page
        try {
            var stored = window.localStorage.getItem(HOST_SIGNUP_DRAFT_KEY);
            if (stored) {
                var parsed = JSON.parse(stored);
                if (parsed.businessName)
                    setBusinessName(parsed.businessName);
                if (parsed.address)
                    setAddress(parsed.address);
                if (parsed.city)
                    setCity(parsed.city);
                if (parsed.state)
                    setState(parsed.state);
                if (parsed.contactName)
                    setContactName(parsed.contactName);
                if (parsed.contactEmail)
                    setContactEmail(parsed.contactEmail);
                if (parsed.contactPhone)
                    setContactPhone(parsed.contactPhone);
                if (parsed.locationType)
                    setLocationType(parsed.locationType);
                if (parsed.description)
                    setDescription(parsed.description);
            }
        }
        catch (_a) {
            // ignore parse/storage errors
        }
        setIsLoading(false);
    }, [isAuthenticated]);
    // Persist host signup draft so hosts can resume later
    useEffect(function () {
        if (isLoading)
            return;
        try {
            var payload = {
                businessName: businessName,
                address: address,
                city: city,
                state: state,
                contactName: contactName,
                contactEmail: contactEmail,
                contactPhone: contactPhone,
                locationType: locationType,
                description: description,
            };
            window.localStorage.setItem(HOST_SIGNUP_DRAFT_KEY, JSON.stringify(payload));
        }
        catch (_a) {
            // ignore storage errors
        }
    }, [
        isLoading,
        businessName,
        address,
        city,
        state,
        contactName,
        contactEmail,
        contactPhone,
        locationType,
        description,
    ]);
    var validate = function () {
        var validationErrors = {};
        if (!businessName.trim())
            validationErrors.businessName = "Business name is required";
        if (!address.trim())
            validationErrors.address = "Address is required";
        if (!city.trim())
            validationErrors.city = "City is required";
        if (!state.trim())
            validationErrors.state = "State is required";
        if (!contactName.trim())
            validationErrors.contactName = "Contact name is required";
        if (!contactEmail.trim())
            validationErrors.contactEmail = "Contact email is required";
        if (!contactPhone.trim())
            validationErrors.contactPhone = "Contact phone is required";
        if (!locationType)
            validationErrors.locationType = "Select a location type";
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };
    var handleSubmit = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var fullAddress, coords, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    if (!validate())
                        return [2 /*return*/];
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    fullAddress = [address, city, state]
                        .map(function (value) { return value.trim(); })
                        .filter(Boolean)
                        .join(", ");
                    return [4 /*yield*/, geocodeAddress(fullAddress).catch(function () { return null; })];
                case 2:
                    coords = _a.sent();
                    return [4 /*yield*/, fetch("/api/hosts", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                businessName: businessName,
                                address: address,
                                city: city,
                                state: state,
                                contactName: contactName,
                                contactEmail: contactEmail,
                                contactPhone: contactPhone,
                                locationType: locationType,
                                description: description,
                                latitude: coords === null || coords === void 0 ? void 0 : coords.lat,
                                longitude: coords === null || coords === void 0 ? void 0 : coords.lng,
                            }),
                        })];
                case 3:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to create host profile");
                case 5:
                    setLocation("/host/dashboard");
                    try {
                        window.localStorage.removeItem(HOST_SIGNUP_DRAFT_KEY);
                    }
                    catch (_b) {
                        // ignore
                    }
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    setErrors({ submit: error_1.message });
                    return [3 /*break*/, 8];
                case 7:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600"/>
      </div>);
    }
    if (!isAuthenticated) {
        return (<div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Become a MealScout Host
          </h1>
          <p className="text-slate-600 mb-8">
            Sign in to create your host profile and start managing food truck
            events.
          </p>
          <Button asChild size="lg">
            <a href="/login?redirect=/host-signup">Sign in to continue</a>
          </Button>
        </div>
      </div>);
    }
    return (<div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Create Host Profile
        </h1>
        <p className="text-slate-600">
          Tell us about your location to start hosting food trucks.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-slate-200 p-8 space-y-6">
        {errors.submit && (<div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">
            {errors.submit}
          </div>)}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Business Details
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" value={businessName} onChange={function (e) { return setBusinessName(e.target.value); }} placeholder="e.g. Tech Park Plaza"/>
            {errors.businessName && (<p className="text-sm text-rose-600">{errors.businessName}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={function (e) { return setAddress(e.target.value); }} placeholder="123 Main St"/>
            {errors.address && (<p className="text-sm text-rose-600">{errors.address}</p>)}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={function (e) { return setCity(e.target.value); }} placeholder="e.g. Austin"/>
              {errors.city && (<p className="text-sm text-rose-600">{errors.city}</p>)}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={function (e) { return setState(e.target.value); }} placeholder="e.g. TX"/>
              {errors.state && (<p className="text-sm text-rose-600">{errors.state}</p>)}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationType">Location Type</Label>
            <select id="locationType" value={locationType} onChange={function (e) { return setLocationType(e.target.value); }} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Select a type...</option>
              {locationTypeOptions.map(function (opt) { return (<option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>); })}
            </select>
            {errors.locationType && (<p className="text-sm text-rose-600">{errors.locationType}</p>)}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact Information
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" value={contactName} onChange={function (e) { return setContactName(e.target.value); }} placeholder="Jane Doe"/>
            {errors.contactName && (<p className="text-sm text-rose-600">{errors.contactName}</p>)}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" type="email" value={contactEmail} onChange={function (e) { return setContactEmail(e.target.value); }} placeholder="jane@example.com"/>
              {errors.contactEmail && (<p className="text-sm text-rose-600">{errors.contactEmail}</p>)}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input id="contactPhone" type="tel" value={contactPhone} onChange={function (e) { return setContactPhone(e.target.value); }} placeholder="(555) 123-4567"/>
              {errors.contactPhone && (<p className="text-sm text-rose-600">{errors.contactPhone}</p>)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Additional Details
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea id="description" value={description} onChange={function (e) { return setDescription(e.target.value); }} placeholder="Tell trucks about parking, power availability, or specific rules..." className="h-32"/>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (<>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Creating Profile...
              </>) : ("Create Host Profile")}
          </Button>
        </div>
      </form>
    </div>);
}
export default HostSignup;
