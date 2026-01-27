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
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
var formatCurrency = function (cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format((cents || 0) / 100);
};
export default function AdminAffiliateManagement() {
    var _this = this;
    var _a = useState(""), search = _a[0], setSearch = _a[1];
    var _b = useState("all"), userType = _b[0], setUserType = _b[1];
    var _c = useState(null), editing = _c[0], setEditing = _c[1];
    var _d = useState(""), percent = _d[0], setPercent = _d[1];
    var _e = useState(""), closerId = _e[0], setCloserId = _e[1];
    var _f = useState(""), bookerId = _f[0], setBookerId = _f[1];
    var _g = useState(false), saving = _g[0], setSaving = _g[1];
    var _h = useState(null), error = _h[0], setError = _h[1];
    var _j = useQuery({
        queryKey: ["admin-affiliates"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/affiliates/users")];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to fetch affiliate users");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }), _k = _j.data, users = _k === void 0 ? [] : _k, refetch = _j.refetch;
    var filtered = useMemo(function () {
        var term = search.trim().toLowerCase();
        return users.filter(function (user) {
            var matchesType = userType === "all" ? true : user.userType === userType;
            var label = "".concat(user.firstName || "", " ").concat(user.lastName || "", " ").concat(user.email || "", " ").concat(user.affiliateTag || "").toLowerCase();
            var matchesSearch = term.length === 0 || label.includes(term);
            return matchesType && matchesSearch;
        });
    }, [users, search, userType]);
    var startEdit = function (user) {
        var _a;
        setEditing(user);
        setPercent(String((_a = user.affiliatePercent) !== null && _a !== void 0 ? _a : 5));
        setCloserId(user.affiliateCloserUserId || "");
        setBookerId(user.affiliateBookerUserId || "");
        setError(null);
    };
    var handleSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editing)
                        return [2 /*return*/];
                    setSaving(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/admin/affiliates/users/".concat(editing.id), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                affiliatePercent: Number(percent),
                                affiliateCloserUserId: closerId || null,
                                affiliateBookerUserId: bookerId || null,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to update affiliate settings");
                case 4: return [4 /*yield*/, refetch()];
                case 5:
                    _a.sent();
                    setEditing(null);
                    return [3 /*break*/, 8];
                case 6:
                    err_1 = _a.sent();
                    setError(err_1.message || "Failed to update affiliate settings");
                    return [3 /*break*/, 8];
                case 7:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
            <input value={search} onChange={function (e) { return setSearch(e.target.value); }} placeholder="Search by name, email, tag..." className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm"/>
          </div>
          <select value={userType} onChange={function (e) { return setUserType(e.target.value); }} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
            <option value="all">All user types</option>
            <option value="customer">Customer</option>
            <option value="restaurant_owner">Restaurant</option>
            <option value="food_truck">Food Truck</option>
            <option value="host">Host</option>
            <option value="event_coordinator">Event Coordinator</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Percent</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Subs / Bookings</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(function (user) {
            var _a;
            return (<TableRow key={user.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName || "Unnamed"} {user.lastName || ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email || "No email"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs uppercase text-gray-600">
                      {user.userType || "unknown"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.affiliateTag || "userXXXX"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {(_a = user.affiliatePercent) !== null && _a !== void 0 ? _a : 5}%
                    </TableCell>
                    <TableCell>{user.linksShared}</TableCell>
                    <TableCell>{user.peopleReferred}</TableCell>
                    <TableCell>{user.paidReferrals}</TableCell>
                    <TableCell>{formatCurrency(user.mealScoutRevenueCents)}</TableCell>
                    <TableCell>{formatCurrency(user.affiliateEarningsCents)}</TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(user.subscriptionRevenueCents)} /{" "}
                        {formatCurrency(user.bookingRevenueCents)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={function () { return startEdit(user); }}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>);
        })}
                {filtered.length === 0 && (<TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-gray-500">
                      No matching users found.
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={function () { return setEditing(null); }}>
        <DialogContent className="admin-dialog">
          <DialogHeader>
            <DialogTitle>Edit Affiliate Settings</DialogTitle>
            <DialogDescription>
              Update commission percent and override booker/closer attribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Commission Percent</label>
              <input type="number" min="0" max="100" value={percent} onChange={function (e) { return setPercent(e.target.value); }} className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"/>
            </div>
            <div>
              <label className="text-sm font-medium">Closer User ID</label>
              <input type="text" value={closerId} onChange={function (e) { return setCloserId(e.target.value); }} className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"/>
            </div>
            <div>
              <label className="text-sm font-medium">Booker User ID</label>
              <input type="text" value={bookerId} onChange={function (e) { return setBookerId(e.target.value); }} className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"/>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={function () { return setEditing(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
