import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { configure } from "@aura/shared/api-client";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "aura_jwt";
const USER_KEY = "aura_user";

// GitHub OAuth endpoints
const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
};

// API base URL — update this to your deployed Vercel URL
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3000";
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? "";

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectUri = makeRedirectUri({ scheme: "auracalendar" });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ["read:user"],
      redirectUri,
    },
    discovery
  );

  // Configure API client whenever token changes
  useEffect(() => {
    if (token) {
      configure(API_BASE, token);
    }
  }, [token]);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        if (savedToken && savedUser) {
          configure(API_BASE, savedToken);
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // Ignore restore errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      if (code) {
        exchangeCode(code, request?.codeVerifier);
      }
    }
  }, [response]);

  const exchangingRef = useRef(false);

  const exchangeCode = async (code: string, codeVerifier?: string) => {
    if (exchangingRef.current) return;
    exchangingRef.current = true;

    try {
      const url = `${API_BASE}/api/auth/mobile`;
      console.log("[Auth] Exchanging code at:", url);
      console.log("[Auth] redirectUri:", redirectUri);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Auth] Exchange HTTP error:", res.status, text);
        Alert.alert("Login Failed", `Server error ${res.status}: ${text}`);
        return;
      }

      const data = await res.json();

      if (!data.token || !data.user) {
        console.error("[Auth] Invalid response:", JSON.stringify(data));
        Alert.alert("Login Failed", data.error ?? "Invalid server response");
        return;
      }

      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      console.error("[Auth] Exchange failed:", err);
      Alert.alert(
        "Login Failed",
        `Network error: ${err instanceof Error ? err.message : String(err)}\n\nAPI: ${API_BASE}`
      );
    } finally {
      exchangingRef.current = false;
    }
  };

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
