import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { BackHeader } from "@/components/back-header";
import { UserCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/customer';
  };

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      // Redirect to home page on success
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Login Failed", 
        description: error.message || "Invalid email or password.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <BackHeader
        title="Join MealScout"
        fallbackHref="/"
        icon={UserCheck}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-6 py-12 max-w-md mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to MealScout!</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Join thousands of food lovers discovering amazing deals near them every day.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Save Your Favorite Deals</h3>
              <p className="text-gray-600 text-sm">Never lose track of the best offers</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10a3 3 0 106 0v5a3 3 0 11-6 0v-5z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Get Personalized Recommendations</h3>
              <p className="text-gray-600 text-sm">Discover deals tailored to your taste</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 5h16a1 1 0 010 2H4a1 1 0 110-2zM4 9h16a1 1 0 010 2H4a1 1 0 110-2zM4 13h8a1 1 0 010 2H4a1 1 0 110-2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Never Miss New Deals</h3>
              <p className="text-gray-600 text-sm">Get notified when your favorites post offers</p>
            </div>
          </div>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign In or Sign Up</h3>
            <p className="text-gray-600 text-sm">Choose your preferred method to continue</p>
          </div>

          {/* Google Login */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isProcessing}
            className="w-full py-4 px-6 font-semibold text-lg rounded-xl bg-white border-2 border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
            data-testid="button-google-signin"
          >
            {isProcessing ? (
              <div className="animate-spin w-5 h-5 mr-3 border-2 border-gray-600 border-t-transparent rounded-full" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Facebook Login */}
          <button 
            onClick={handleFacebookLogin}
            disabled={isProcessing}
            className="w-full py-4 px-6 font-semibold text-lg rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe5] transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
            data-testid="button-facebook-login"
          >
            {isProcessing ? (
              <div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            Continue with Facebook
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Toggle between email login and signup */}
          {!showEmailLogin ? (
            <div className="space-y-4">
              <button 
                onClick={() => setShowEmailLogin(true)}
                className="w-full py-4 px-6 font-semibold text-lg rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                data-testid="button-email-login"
              >
                Sign In with Email
              </button>
              
              <Link href="/customer-signup">
                <button 
                  data-testid="button-customer-signup"
                  className="w-full py-4 px-6 font-semibold text-lg rounded-xl border-2 border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  Create Account with Email →
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none text-lg"
                  data-testid="input-email"
                  required
                />
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none text-lg pr-12"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 px-6 font-semibold text-lg rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
                data-testid="button-login-submit"
              >
                {isLoggingIn ? (
                  <div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                ) : null}
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </button>
              
              <button
                type="button"
                onClick={() => setShowEmailLogin(false)}
                className="w-full text-center text-gray-600 hover:text-gray-800 transition-colors"
                data-testid="button-back-to-options"
              >
                ← Back to login options
              </button>
              
              <div className="text-center">
                <Link href="/forgot-password" className="text-red-600 hover:text-red-700 text-sm">
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}


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
          <p className="text-gray-600 text-sm mb-3">Looking to promote your business?</p>
          <Link href="/restaurant-signup">
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
              <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">Terms of Service</span>
            </Link> and{" "}
            <Link href="/privacy-policy">
              <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">Privacy Policy</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}