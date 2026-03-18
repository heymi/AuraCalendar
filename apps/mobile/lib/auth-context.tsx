import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { Platform } from "react-native";

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

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        if (savedToken && savedUser) {
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
    console.log("[Auth] OAuth response:", response?.type, response?.type === "success" ? response.params : "");
    if (response?.type === "success") {
      const { code } = response.params;
      if (code) {
        exchangeCode(code);
      } else {
        console.error("[Auth] No code in response params:", response.params);
      }
    }
  }, [response]);

  const exchangeCode = async (code: string) => {
    try {
      console.log("[Auth] Exchanging code with:", `${API_BASE}/api/auth/mobile`);
      const res = await fetch(`${API_BASE}/api/auth/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      console.log("[Auth] Exchange response:", res.status, JSON.stringify(data));
      if (data.token && data.user) {
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
    } catch (err) {
      console.error("[Auth] Exchange failed:", err);
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
