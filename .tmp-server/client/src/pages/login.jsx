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
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiUrl } from "@/lib/api";
import { BackHeader } from "@/components/back-header";
import { UserCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { SEOHead } from "@/components/seo-head";
export default function Login() {
    var _this = this;
    var _a = useAuth(), isAuthenticated = _a.isAuthenticated, isLoading = _a.isLoading;
    var toast = useToast().toast;
    var _b = useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var _c = useState(false), showEmailLogin = _c[0], setShowEmailLogin = _c[1];
    var _d = useState(false), showPassword = _d[0], setShowPassword = _d[1];
    var _e = useState(""), email = _e[0], setEmail = _e[1];
    var _f = useState(""), password = _f[0], setPassword = _f[1];
    var _g = useState(false), isLoggingIn = _g[0], setIsLoggingIn = _g[1];
    var handleGoogleLogin = function () {
        window.location.href = "/api/auth/google/customer";
    };
    var handleFacebookLogin = function () {
        window.location.href = "/api/auth/facebook?userType=customer";
    };
    var handleEmailLogin = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, error, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    if (!email || !password) {
                        toast({
                            title: "Missing Information",
                            description: "Please enter both email and password.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setIsLoggingIn(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, 11, 12]);
                    return [4 /*yield*/, fetch(apiUrl("/api/auth/login"), {
                            method: "POST",
                            body: JSON.stringify({ email: email, password: password }),
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                        })];
                case 2:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    error = _b.sent();
                    throw new Error(error.error || "Login failed");
                case 4:
                    _b.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, queryClient.refetchQueries({ queryKey: ["/api/auth/user"] })];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 7:
                    _a = _b.sent();
                    return [3 /*break*/, 8];
                case 8: 
                // Small delay to ensure cookie/session propagation
                return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 200); })];
                case 9:
                    // Small delay to ensure cookie/session propagation
                    _b.sent();
                    // Redirect to home page on success
                    window.location.href = "/";
                    return [3 /*break*/, 12];
                case 10:
                    error_1 = _b.sent();
                    toast({
                        title: "Login Failed",
                        description: error_1.message || "Invalid email or password.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 12];
                case 11:
                    setIsLoggingIn(false);
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    }); };
    // Redirect to home if already authenticated
    useEffect(function () {
        if (isAuthenticated) {
            window.location.href = "/";
        }
    }, [isAuthenticated]);
    if (isLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"/>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <SEOHead title="Login - MealScout | Access Your Account" description="Log in to MealScout to discover exclusive food deals, save your favorite restaurants, and track your claimed deals. Join thousands of users finding amazing dining discounts." keywords="login, sign in, mealscout account, food deals login, restaurant deals access" canonicalUrl="https://mealscout.us/login" noIndex={true}/>
      <BackHeader title="Log In" fallbackHref="/" icon={UserCheck} className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"/>

      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-sm">
            Log in to access your saved deals and favorites
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign In</h3>
            <p className="text-gray-600 text-sm">
              Choose your preferred method
            </p>
          </div>
          {/* Google Login */}
          <button onClick={handleGoogleLogin} disabled={isProcessing} className="w-full py-4 px-6 font-semibold text-lg rounded-xl bg-white border-2 border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg" data-testid="button-google-signin">
            {isProcessing ? (<div className="animate-spin w-5 h-5 mr-3 border-2 border-gray-600 border-t-transparent rounded-full"/>) : (<svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>)}
            Continue with Google
          </button>

          {/* Facebook Login */}
          <button onClick={handleFacebookLogin} disabled={isProcessing} className="w-full py-4 px-6 font-semibold text-lg rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe5] transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg" data-testid="button-facebook-login">
            {isProcessing ? (<div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full"/>) : (<svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>)}
            Continue with Facebook
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Toggle between email login and signup */}
          {!showEmailLogin ? (<div className="space-y-4">
              <button onClick={function () { return setShowEmailLogin(true); }} className="w-full py-4 px-6 font-semibold text-lg rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg" data-testid="button-email-login">
                Sign In with Email
              </button>

              <Link href="/customer-signup">
                <button data-testid="button-customer-signup" className="w-full py-3 px-4 font-medium text-sm rounded-lg border-2 border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all duration-200 flex items-center justify-center">
                  CREATE ACCOUNT
                </button>
              </Link>
            </div>) : (<form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <input type="email" placeholder="Email address" value={email} onChange={function (e) { return setEmail(e.target.value); }} className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none text-lg" data-testid="input-email" required/>
              </div>

              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={function (e) { return setPassword(e.target.value); }} className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none text-lg pr-12" data-testid="input-password" required/>
                <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" data-testid="button-toggle-password">
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>

              <button type="submit" disabled={isLoggingIn} className="w-full py-4 px-6 font-semibold text-lg rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg" data-testid="button-login-submit">
                {isLoggingIn ? (<div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full"/>) : null}
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </button>

              <button type="button" onClick={function () { return setShowEmailLogin(false); }} className="w-full text-center text-gray-600 hover:text-gray-800 transition-colors" data-testid="button-back-to-options">
                ← Back to login options
              </button>

              <div className="text-center">
                <Link href="/forgot-password" className="text-red-600 hover:text-red-700 text-sm">
                  Forgot your password?
                </Link>
              </div>
            </form>)}

          {/* Trust indicators */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>100% Free</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Looking to promote your business?
          </p>
          <Link href="/customer-signup?role=business">
            <button className="py-2 px-4 font-medium text-blue-600 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 rounded-lg transition-all duration-200" data-testid="link-business-signup">
              Business Sign Up →
            </button>
          </Link>
        </div>

        {/* Legal Links */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By using MealScout, you agree to our{" "}
            <Link href="/terms-of-service">
              <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">
                Terms of Service
              </span>
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy">
              <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">
                Privacy Policy
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>);
}
