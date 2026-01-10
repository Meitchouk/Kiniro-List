"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthChange, signInWithGoogle, signOut, getIdToken } from "@/lib/auth/clientAuth";
import { getTimezone } from "@/lib/utils/date";
import { useLoading } from "@/components/providers/LoadingProvider";
import type { UserResponse } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userData: UserResponse | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  getAuthHeaders: (options?: { forceRefresh?: boolean }) => Promise<Record<string, string>>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, setInitialLoading } = useLoading();

  const fetchUserData = async (firebaseUser: User) => {
    try {
      startLoading("fetchUserData");
      // Force refresh to avoid stale tokens after sign-in
      const token = await firebaseUser.getIdToken(true);
      const timezone = getTimezone();
      const locale =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("NEXT_LOCALE="))
          ?.split("=")[1] || "en";

      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-timezone": timezone,
          "x-locale": locale,
          "x-theme": localStorage.getItem("theme") || "system",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch user data: ${response.status}`, errorText);
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Don't re-throw - let the error be handled in the useEffect
      return error;
    } finally {
      stopLoading("fetchUserData");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const err = await fetchUserData(firebaseUser);
        if (err) {
          console.error("Failed to fetch user data during auth change:", err);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
      setInitialLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async () => {
    try {
      startLoading("signIn");
      const firebaseUser = await signInWithGoogle();
      const err = await fetchUserData(firebaseUser);
      if (err) throw err;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      stopLoading("signIn");
    }
  };

  const logOut = async () => {
    try {
      startLoading("logOut");
      await signOut();
      setUserData(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      stopLoading("logOut");
    }
  };

  const getAuthHeaders = async (options?: {
    forceRefresh?: boolean;
  }): Promise<Record<string, string>> => {
    const token = await getIdToken(options?.forceRefresh);
    const timezone = userData?.timezone || getTimezone();
    const locale = userData?.locale || "en";
    const theme = userData?.theme || "system";

    const headers: Record<string, string> = {
      "x-timezone": timezone,
      "x-locale": locale,
      "x-theme": theme,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  const refetchUser = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        logOut,
        getAuthHeaders,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
