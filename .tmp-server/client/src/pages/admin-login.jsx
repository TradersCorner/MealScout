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
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff } from "lucide-react";
export default function AdminLogin() {
    var _this = this;
    var _a = useState(""), email = _a[0], setEmail = _a[1];
    var _b = useState(""), password = _b[0], setPassword = _b[1];
    var _c = useState(false), showPassword = _c[0], setShowPassword = _c[1];
    var toast = useToast().toast;
    var loginMutation = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var email = _b.email, password = _b.password;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/auth/login", { email: email, password: password })];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            var _a;
            if (((_a = data.user) === null || _a === void 0 ? void 0 : _a.userType) === 'admin') {
                toast({
                    title: "Admin Login Successful",
                    description: "Welcome back, ".concat(data.user.firstName || 'Admin', "!"),
                });
                // Redirect to admin dashboard
                window.location.href = "/admin/dashboard";
            }
            else {
                toast({
                    title: "Access Denied",
                    description: "This account does not have admin privileges.",
                    variant: "destructive",
                });
            }
        },
        onError: function (error) {
            toast({
                title: "Login Failed",
                description: error.message || "Invalid email or password",
                variant: "destructive",
            });
        },
    });
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!email || !password) {
            toast({
                title: "Missing Information",
                description: "Please enter both email and password",
                variant: "destructive",
            });
            return;
        }
        loginMutation.mutate({ email: email, password: password });
    };
    return (<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-white"/>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Admin Access
          </CardTitle>
          <p className="text-gray-600">
            Sign in with your admin credentials
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Admin Email
              </Label>
              <Input id="email" name="email" type="email" value={email} onChange={function (e) { return setEmail(e.target.value); }} placeholder="Enter admin email" autoComplete="email" required disabled={loginMutation.isPending} data-testid="input-admin-email" className="h-12"/>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Admin Password
              </Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={function (e) { return setPassword(e.target.value); }} placeholder="Enter admin password" autoComplete="current-password" required disabled={loginMutation.isPending} data-testid="input-admin-password" className="h-12 pr-12"/>
                <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" data-testid="button-toggle-password">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={loginMutation.isPending} data-testid="button-admin-login">
              {loginMutation.isPending ? (<div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  <span>Signing In...</span>
                </div>) : (<>
                  <Shield className="w-5 h-5 mr-2"/>
                  Sign In as Admin
                </>)}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password">
              <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer text-sm" data-testid="link-forgot-password">
                Forgot your password?
              </span>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Need to access the main app?{" "}
              <a href="/" className="text-primary hover:underline font-medium">
                Go to homepage
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>);
}
