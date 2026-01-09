import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useEffect } from "react";

export type AuthState = "loading" | "authenticated" | "guest";

export function useAuth() {
  const { data: user, isLoading, isError, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 60_000, // Consider user data fresh for 1 minute
  });

  const authState: AuthState = isLoading ? "loading" : user ? "authenticated" : "guest";

  // Check for OAuth redirect completion and refresh auth state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('code') || urlParams.has('state') || 
                         urlParams.has('auth') || window.location.pathname.includes('/callback');
    
    if (hasAuthParams) {
      console.log('🔄 OAuth redirect detected, refreshing auth state');
      // Short delay to ensure session is established
      const timeoutId = setTimeout(() => {
        refetch();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [refetch]);

  return {
    user,
    isLoading,
    isError,
    error,
    authState,
    isAuthenticated: authState === "authenticated",
    isGuest: authState === "guest",
    refetch,
  };
}
