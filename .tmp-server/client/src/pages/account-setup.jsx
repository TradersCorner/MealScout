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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, CheckCircle, KeyRound } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { SEOHead } from "@/components/seo-head";
import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS, } from "@/utils/passwordPolicy";
var accountSetupSchema = z
    .object({
    password: z
        .string()
        .min(1, PASSWORD_REQUIREMENTS)
        .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(5, "Phone number is required"),
})
    .refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export default function AccountSetup() {
    var _this = this;
    var _a = useLocation(), setLocation = _a[1];
    var toast = useToast().toast;
    var _b = useState(false), showPassword = _b[0], setShowPassword = _b[1];
    var _c = useState(false), showConfirmPassword = _c[0], setShowConfirmPassword = _c[1];
    var _d = useState(null), token = _d[0], setToken = _d[1];
    var _e = useState(false), setupComplete = _e[0], setSetupComplete = _e[1];
    // Extract token from URL parameters
    useEffect(function () {
        var urlParams = new URLSearchParams(window.location.search);
        var tokenParam = urlParams.get("token");
        setToken(tokenParam);
    }, []);
    var form = useForm({
        resolver: zodResolver(accountSetupSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
            firstName: "",
            lastName: "",
            phone: "",
        },
    });
    // Validate token on mount
    var _f = useQuery({
        queryKey: ["/api/auth/validate-setup-token", token],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!token) {
                            throw new Error("No token provided");
                        }
                        return [4 /*yield*/, fetch("/api/auth/validate-setup-token?token=".concat(encodeURIComponent(token)))];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        error = _a.sent();
                        throw new Error(error.error || "Invalid token");
                    case 3: return [2 /*return*/, res.json()];
                }
            });
        }); },
        enabled: !!token,
        retry: false,
    }), tokenValidation = _f.data, isValidatingToken = _f.isLoading, tokenError = _f.error;
    // Pre-fill name fields if available
    useEffect(function () {
        if (tokenValidation === null || tokenValidation === void 0 ? void 0 : tokenValidation.firstName) {
            form.setValue("firstName", tokenValidation.firstName);
        }
        if (tokenValidation === null || tokenValidation === void 0 ? void 0 : tokenValidation.lastName) {
            form.setValue("lastName", tokenValidation.lastName);
        }
        if (tokenValidation === null || tokenValidation === void 0 ? void 0 : tokenValidation.phone) {
            form.setValue("phone", tokenValidation.phone);
        }
    }, [tokenValidation, form]);
    var setupMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/auth/complete-setup", {
                            token: token,
                            password: data.password,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            phone: data.phone,
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            setSetupComplete(true);
            toast({
                title: "Account Setup Complete!",
                description: "Your account is ready. You can now log in.",
            });
            // Redirect to login after 2 seconds
            setTimeout(function () {
                setLocation("/login");
            }, 2000);
        },
        onError: function (error) {
            toast({
                title: "Setup Failed",
                description: error.message ||
                    "Failed to complete account setup. Please try again.",
                variant: "destructive",
            });
        },
    });
    var onSubmit = function (data) {
        setupMutation.mutate(data);
    };
    // Get password strength info
    var password = form.watch("password");
    var getPasswordStrength = function (password) {
        if (!password)
            return { level: 0, text: "", color: "gray" };
        if (password.length < 8)
            return { level: 1, text: "Too short", color: "red" };
        if (password.length < 10)
            return { level: 2, text: "Weak", color: "orange" };
        if (password.length < 12 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password))
            return { level: 3, text: "Good", color: "blue" };
        if (password.length >= 12 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password))
            return { level: 4, text: "Strong", color: "green" };
        return { level: 2, text: "Weak", color: "orange" };
    };
    var passwordStrength = getPasswordStrength(password);
    // Loading state
    if (!token || isValidatingToken) {
        return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Validating setup link...</p>
          </CardContent>
        </Card>
      </div>);
    }
    // Invalid or expired token
    if (tokenError || !(tokenValidation === null || tokenValidation === void 0 ? void 0 : tokenValidation.valid)) {
        return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <SEOHead title="Invalid Setup Link - MealScout" description="This account setup link is invalid or has expired." noIndex={true}/>
        <BackHeader title="Account Setup" fallbackHref="/login" icon={KeyRound} className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"/>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Invalid Setup Link</CardTitle>
              <CardDescription>
                This account setup link has expired or has already been used.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Please contact support or request a new setup link.
              </p>
              <Button className="w-full" onClick={function () { return setLocation("/login"); }}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>);
    }
    // Setup complete state
    if (setupComplete) {
        return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <SEOHead title="Setup Complete - MealScout" description="Your MealScout account is ready!" noIndex={true}/>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500"/>
              </div>
              <CardTitle className="text-center text-green-600">
                Account Setup Complete!
              </CardTitle>
              <CardDescription className="text-center">
                Redirecting you to login...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>);
    }
    // Main setup form
    return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <SEOHead title="Complete Your Account - MealScout" description="Set up your MealScout account password and profile." noIndex={true}/>
      <BackHeader title="Complete Your Account" fallbackHref="/login" icon={KeyRound} className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"/>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to MealScout!</CardTitle>
            <CardDescription>
              Complete your profile to get started
              {(tokenValidation === null || tokenValidation === void 0 ? void 0 : tokenValidation.userEmail) && (<span className="block mt-1 font-medium text-gray-700">
                  {tokenValidation.userEmail}
                </span>)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...form.register("firstName")} placeholder="John" disabled={setupMutation.isPending}/>
                  {form.formState.errors.firstName && (<p className="text-sm text-red-600">
                      {form.formState.errors.firstName.message}
                    </p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...form.register("lastName")} placeholder="Doe" disabled={setupMutation.isPending}/>
                  {form.formState.errors.lastName && (<p className="text-sm text-red-600">
                      {form.formState.errors.lastName.message}
                    </p>)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input id="phone" {...form.register("phone")} placeholder="(555) 123-4567" disabled={setupMutation.isPending}/>
                {form.formState.errors.phone && (<p className="text-sm text-red-600">
                    {form.formState.errors.phone.message}
                  </p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Create Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} {...form.register("password")} placeholder="At least 8 characters" disabled={setupMutation.isPending} className="pr-10"/>
                  <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={setupMutation.isPending}>
                    {showPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                  </button>
                </div>
                {password && (<div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className={"h-full transition-all duration-300 bg-".concat(passwordStrength.color, "-500")} style={{
                width: "".concat((passwordStrength.level / 4) * 100, "%"),
            }}/>
                    </div>
                    <span className={"text-xs font-medium text-".concat(passwordStrength.color, "-600")}>
                      {passwordStrength.text}
                    </span>
                  </div>)}
                {form.formState.errors.password && (<p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} {...form.register("confirmPassword")} placeholder="Re-enter your password" disabled={setupMutation.isPending} className="pr-10"/>
                  <button type="button" onClick={function () { return setShowConfirmPassword(!showConfirmPassword); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={setupMutation.isPending}>
                    {showConfirmPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (<p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>)}
              </div>

              <Button type="submit" className="w-full" disabled={setupMutation.isPending}>
                {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>);
}
