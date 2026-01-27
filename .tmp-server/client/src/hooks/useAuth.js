import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { setAffiliateRef } from "@/lib/share";
export function useAuth() {
    var _a = useLocation(), setLocation = _a[1];
    var _b = useQuery({
        queryKey: ["/api/auth/user"],
        queryFn: getQueryFn({ on401: "returnNull" }),
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        staleTime: 5 * 60000, // Consider user data fresh for 5 minutes (reduce auth calls)
    }), user = _b.data, isLoading = _b.isLoading, isError = _b.isError, error = _b.error, refetch = _b.refetch;
    var authState = isLoading
        ? "loading"
        : user
            ? "authenticated"
            : "guest";
    // Check for password reset requirement
    useEffect(function () {
        if ((user === null || user === void 0 ? void 0 : user.requiresPasswordReset) &&
            window.location.pathname !== "/change-password") {
            console.log("🔒 User must reset password, redirecting...");
            setLocation("/change-password");
        }
    }, [user, setLocation]);
    useEffect(function () {
        if ((user === null || user === void 0 ? void 0 : user.affiliateTag) || (user === null || user === void 0 ? void 0 : user.id)) {
            setAffiliateRef(user.affiliateTag || user.id);
        }
        else {
            setAffiliateRef(null);
        }
    }, [user === null || user === void 0 ? void 0 : user.affiliateTag, user === null || user === void 0 ? void 0 : user.id]);
    // Check for OAuth redirect completion and refresh auth state
    useEffect(function () {
        var urlParams = new URLSearchParams(window.location.search);
        var hasAuthParams = urlParams.has("code") ||
            urlParams.has("state") ||
            urlParams.has("auth") ||
            window.location.pathname.includes("/callback");
        if (hasAuthParams) {
            console.log("🔄 OAuth redirect detected, refreshing auth state");
            // Short delay to ensure session is established
            var timeoutId_1 = setTimeout(function () {
                refetch();
            }, 500);
            return function () { return clearTimeout(timeoutId_1); };
        }
    }, [refetch]);
    return {
        user: user,
        isLoading: isLoading,
        isError: isError,
        error: error,
        authState: authState,
        isAuthenticated: authState === "authenticated",
        isGuest: authState === "guest",
        requiresPasswordReset: (user === null || user === void 0 ? void 0 : user.requiresPasswordReset) || false,
        refetch: refetch,
    };
}
