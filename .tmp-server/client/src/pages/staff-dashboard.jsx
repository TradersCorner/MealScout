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
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Store, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import Navigation from "@/components/navigation";
import { Link } from "wouter";
export default function StaffDashboard() {
    var _this = this;
    var user = useAuth().user;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    // Customer creation form
    var _a = useState(""), customerEmail = _a[0], setCustomerEmail = _a[1];
    var _b = useState(""), customerFirstName = _b[0], setCustomerFirstName = _b[1];
    var _c = useState(""), customerLastName = _c[0], setCustomerLastName = _c[1];
    var _d = useState(""), customerPhone = _d[0], setCustomerPhone = _d[1];
    // Restaurant owner creation form
    var _e = useState(""), ownerEmail = _e[0], setOwnerEmail = _e[1];
    var _f = useState(""), ownerFirstName = _f[0], setOwnerFirstName = _f[1];
    var _g = useState(""), ownerLastName = _g[0], setOwnerLastName = _g[1];
    var _h = useState(""), ownerPhone = _h[0], setOwnerPhone = _h[1];
    var _j = useState(""), restaurantName = _j[0], setRestaurantName = _j[1];
    var _k = useState(""), restaurantAddress = _k[0], setRestaurantAddress = _k[1];
    var _l = useState(""), restaurantPhone = _l[0], setRestaurantPhone = _l[1];
    // Generic user creation form
    var _m = useState(""), genericEmail = _m[0], setGenericEmail = _m[1];
    var _o = useState(""), genericFirstName = _o[0], setGenericFirstName = _o[1];
    var _p = useState(""), genericLastName = _p[0], setGenericLastName = _p[1];
    var _q = useState(""), genericPhone = _q[0], setGenericPhone = _q[1];
    var _r = useState("customer"), genericUserType = _r[0], setGenericUserType = _r[1];
    // Created account state
    var _s = useState(null), createdAccount = _s[0], setCreatedAccount = _s[1];
    // Verify staff access
    var _t = useQuery({
        queryKey: ["/api/auth/admin/verify"],
        retry: false,
    }), staffCheck = _t.data, checkingAccess = _t.isLoading;
    var createCustomer = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/staff/users", data)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            setCreatedAccount({
                userId: data.userId,
                email: data.email,
                tempPassword: data.tempPassword,
            });
            toast({
                title: "Customer Created",
                description: "Account created for ".concat(data.email),
            });
            // Reset form
            setCustomerEmail("");
            setCustomerFirstName("");
            setCustomerLastName("");
            setCustomerPhone("");
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to create customer account",
                variant: "destructive",
            });
        },
    });
    var createRestaurantOwner = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/staff/restaurant-owners", data)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            setCreatedAccount({
                userId: data.userId,
                email: data.email,
                tempPassword: data.tempPassword,
                restaurantId: data.restaurantId,
            });
            toast({
                title: "Restaurant Owner Created",
                description: data.restaurantId
                    ? "Account and restaurant created for ".concat(data.email)
                    : "Account created for ".concat(data.email),
            });
            // Reset form
            setOwnerEmail("");
            setOwnerFirstName("");
            setOwnerLastName("");
            setOwnerPhone("");
            setRestaurantName("");
            setRestaurantAddress("");
            setRestaurantPhone("");
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to create restaurant owner account",
                variant: "destructive",
            });
        },
    });
    var createGenericUser = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/staff/users", __assign(__assign({}, data), { userType: genericUserType }))];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            setCreatedAccount({
                userId: data.userId,
                email: data.email,
                tempPassword: data.tempPassword,
            });
            toast({
                title: "User Created",
                description: "".concat(genericUserType, " account created for ").concat(data.email),
            });
            // Reset form
            setGenericEmail("");
            setGenericFirstName("");
            setGenericLastName("");
            setGenericPhone("");
            setGenericUserType("customer");
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to create user account",
                variant: "destructive",
            });
        },
    });
    var copyToClipboard = function (text) {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied",
            description: "Password copied to clipboard",
        });
    };
    if (checkingAccess) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (!staffCheck ||
        ((user === null || user === void 0 ? void 0 : user.userType) !== "staff" && (user === null || user === void 0 ? void 0 : user.userType) !== "admin")) {
        return (<div className="max-w-md mx-auto mt-20 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          This dashboard is only accessible to staff members and administrators.
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>);
    }
    return (<div className="min-h-screen bg-background pb-20">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Staff Dashboard
          </h1>
          <p className="text-muted-foreground">
            Create customer and restaurant owner accounts on the spot
          </p>
        </div>

        {/* Created Account Display */}
        {createdAccount && (<Card className="mb-8 border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5"/>
                Account Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {createdAccount.email}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold">Temp Password:</span>
                <code className="bg-white px-3 py-1 rounded border text-sm break-all">
                  {createdAccount.tempPassword}
                </code>
                <Button size="sm" variant="outline" onClick={function () { return copyToClipboard(createdAccount.tempPassword); }}>
                  <Copy className="w-4 h-4"/>
                </Button>
              </div>
              {createdAccount.restaurantId && (<div>
                  <span className="font-semibold">Restaurant ID:</span>{" "}
                  {createdAccount.restaurantId}
                </div>)}
              <p className="text-sm text-muted-foreground mt-2">
                ⚠️ User must reset password on first login. Copy this password
                and share it with the user.
              </p>
              <Button size="sm" variant="outline" onClick={function () { return setCreatedAccount(null); }}>
                Dismiss
              </Button>
            </CardContent>
          </Card>)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* Create Any User Type (Admin only) */}
          {(user === null || user === void 0 ? void 0 : user.userType) === "admin" && (<Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5"/>
                  Create User (Any Type)
                </CardTitle>
                <CardDescription>
                  Create any type of user account with temporary password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={function (e) {
                e.preventDefault();
                createGenericUser.mutate({
                    email: genericEmail,
                    firstName: genericFirstName || undefined,
                    lastName: genericLastName || undefined,
                    phone: genericPhone || undefined,
                });
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="generic-email">Email *</Label>
                    <Input id="generic-email" type="email" value={genericEmail} onChange={function (e) { return setGenericEmail(e.target.value); }} required/>
                  </div>
                  <div>
                    <Label htmlFor="generic-user-type">User Type *</Label>
                    <select id="generic-user-type" value={genericUserType} onChange={function (e) { return setGenericUserType(e.target.value); }} className="w-full px-3 py-2 border rounded-md bg-background">
                      <option value="customer">Customer</option>
                      <option value="restaurant_owner">Restaurant Owner</option>
                      <option value="event_coordinator">Event Coordinator</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="generic-first-name">First Name</Label>
                    <Input id="generic-first-name" type="text" value={genericFirstName} onChange={function (e) { return setGenericFirstName(e.target.value); }}/>
                  </div>
                  <div>
                    <Label htmlFor="generic-last-name">Last Name</Label>
                    <Input id="generic-last-name" type="text" value={genericLastName} onChange={function (e) { return setGenericLastName(e.target.value); }}/>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="generic-phone">Phone</Label>
                    <Input id="generic-phone" type="tel" value={genericPhone} onChange={function (e) { return setGenericPhone(e.target.value); }}/>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full" disabled={createGenericUser.isPending || !genericEmail}>
                      {createGenericUser.isPending
                ? "Creating..."
                : "Create ".concat(genericUserType.replace("_", " "))}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>)}

          {/* Create Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5"/>
                Create Customer Account
              </CardTitle>
              <CardDescription>
                Create a diner/customer account with temporary password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={function (e) {
            e.preventDefault();
            createCustomer.mutate({
                email: customerEmail,
                firstName: customerFirstName || undefined,
                lastName: customerLastName || undefined,
                phone: customerPhone || undefined,
            });
        }} className="space-y-4">
                <div>
                  <Label htmlFor="customer-email">Email *</Label>
                  <Input id="customer-email" type="email" value={customerEmail} onChange={function (e) { return setCustomerEmail(e.target.value); }} required/>
                </div>
                <div>
                  <Label htmlFor="customer-first-name">First Name</Label>
                  <Input id="customer-first-name" type="text" value={customerFirstName} onChange={function (e) { return setCustomerFirstName(e.target.value); }}/>
                </div>
                <div>
                  <Label htmlFor="customer-last-name">Last Name</Label>
                  <Input id="customer-last-name" type="text" value={customerLastName} onChange={function (e) { return setCustomerLastName(e.target.value); }}/>
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input id="customer-phone" type="tel" value={customerPhone} onChange={function (e) { return setCustomerPhone(e.target.value); }}/>
                </div>
                <Button type="submit" className="w-full" disabled={createCustomer.isPending || !customerEmail}>
                  {createCustomer.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create Restaurant Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5"/>
                Create Restaurant Owner
              </CardTitle>
              <CardDescription>
                Create restaurant owner account with optional restaurant shell
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={function (e) {
            e.preventDefault();
            createRestaurantOwner.mutate({
                email: ownerEmail,
                firstName: ownerFirstName || undefined,
                lastName: ownerLastName || undefined,
                phone: ownerPhone || undefined,
                restaurantName: restaurantName || undefined,
                restaurantAddress: restaurantAddress || undefined,
                restaurantPhone: restaurantPhone || undefined,
            });
        }} className="space-y-4">
                <div>
                  <Label htmlFor="owner-email">Email *</Label>
                  <Input id="owner-email" type="email" value={ownerEmail} onChange={function (e) { return setOwnerEmail(e.target.value); }} required/>
                </div>
                <div>
                  <Label htmlFor="owner-first-name">First Name</Label>
                  <Input id="owner-first-name" type="text" value={ownerFirstName} onChange={function (e) { return setOwnerFirstName(e.target.value); }}/>
                </div>
                <div>
                  <Label htmlFor="owner-last-name">Last Name</Label>
                  <Input id="owner-last-name" type="text" value={ownerLastName} onChange={function (e) { return setOwnerLastName(e.target.value); }}/>
                </div>
                <div>
                  <Label htmlFor="owner-phone">Phone</Label>
                  <Input id="owner-phone" type="tel" value={ownerPhone} onChange={function (e) { return setOwnerPhone(e.target.value); }}/>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-semibold mb-3 text-muted-foreground">
                    Optional Restaurant Details
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="restaurant-name">Restaurant Name</Label>
                      <Input id="restaurant-name" type="text" value={restaurantName} onChange={function (e) { return setRestaurantName(e.target.value); }}/>
                    </div>
                    <div>
                      <Label htmlFor="restaurant-address">Address</Label>
                      <Input id="restaurant-address" type="text" value={restaurantAddress} onChange={function (e) { return setRestaurantAddress(e.target.value); }}/>
                    </div>
                    <div>
                      <Label htmlFor="restaurant-phone">Phone</Label>
                      <Input id="restaurant-phone" type="tel" value={restaurantPhone} onChange={function (e) { return setRestaurantPhone(e.target.value); }}/>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createRestaurantOwner.isPending || !ownerEmail}>
                  {createRestaurantOwner.isPending
            ? "Creating..."
            : "Create Restaurant Owner"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        {(user === null || user === void 0 ? void 0 : user.userType) === "admin" && (<Card className="mt-8">
            <CardHeader>
              <CardTitle>Admin Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Link href="/admin/dashboard">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>)}
      </div>
    </div>);
}
