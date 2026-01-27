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
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS, } from "@/utils/passwordPolicy";
export default function ChangePassword() {
    var _this = this;
    var _a = useLocation(), setLocation = _a[1];
    var toast = useToast().toast;
    var _b = useAuth(), user = _b.user, refetch = _b.refetch;
    var _c = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    }), formData = _c[0], setFormData = _c[1];
    var _d = useState({}), errors = _d[0], setErrors = _d[1];
    var changePassword = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/auth/change-password", data)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        toast({
                            title: "Password Changed",
                            description: "Your password has been successfully changed. You can now continue using the app.",
                        });
                        // Refetch user to clear the requiresPasswordReset flag
                        return [4 /*yield*/, refetch()];
                    case 1:
                        // Refetch user to clear the requiresPasswordReset flag
                        _a.sent();
                        // Redirect based on user type
                        setTimeout(function () {
                            if ((user === null || user === void 0 ? void 0 : user.userType) === "restaurant_owner") {
                                setLocation("/restaurant-owner-dashboard");
                            }
                            else if ((user === null || user === void 0 ? void 0 : user.userType) === "admin" ||
                                (user === null || user === void 0 ? void 0 : user.userType) === "super_admin" ||
                                (user === null || user === void 0 ? void 0 : user.userType) === "staff") {
                                setLocation("/admin-dashboard");
                            }
                            else {
                                setLocation("/map");
                            }
                        }, 1000);
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to change password. Please try again.",
                variant: "destructive",
            });
        },
    });
    var validateForm = function () {
        var newErrors = {};
        if (!formData.currentPassword) {
            newErrors.currentPassword = "Current password is required";
        }
        if (!formData.newPassword) {
            newErrors.newPassword = "New password is required";
        }
        else if (!PASSWORD_REGEX.test(formData.newPassword)) {
            newErrors.newPassword = PASSWORD_REQUIREMENTS;
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        }
        else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e.preventDefault();
            if (!validateForm()) {
                return [2 /*return*/];
            }
            changePassword.mutate({
                oldPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            return [2 /*return*/];
        });
    }); };
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-orange-600"/>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Change Your Password
          </CardTitle>
          <CardDescription>
            You're using a temporary password. Please create a new password to
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-yellow-800">
              For your security, you must change your temporary password before
              accessing the app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={formData.currentPassword} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { currentPassword: e.target.value }));
        }} placeholder="Enter your temporary password"/>
              {errors.currentPassword && (<p className="text-sm text-red-600">{errors.currentPassword}</p>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={formData.newPassword} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { newPassword: e.target.value }));
        }} placeholder="At least 8 characters"/>
              {errors.newPassword && (<p className="text-sm text-red-600">{errors.newPassword}</p>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { confirmPassword: e.target.value }));
        }} placeholder="Re-enter your new password"/>
              {errors.confirmPassword && (<p className="text-sm text-red-600">{errors.confirmPassword}</p>)}
            </div>

            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending
            ? "Changing Password..."
            : "Change Password"}
            </Button>
          </form>

          {changePassword.isSuccess && (<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600"/>
              <p className="text-sm text-green-800">
                Password changed successfully! Redirecting...
              </p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
