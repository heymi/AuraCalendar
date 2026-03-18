import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth-context";
import { initApi } from "../../lib/api";

export default function TabLayout() {
  const theme = useTheme();
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Initialize API client when token is available
  useEffect(() => {
    if (token) {
      initApi(token);
    }
  }, [token]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: "600",
          letterSpacing: -0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "日历",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "任务",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "checklist", android: "checklist", web: "checklist" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "笔记",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "note.text", android: "sticky_note_2", web: "sticky_note_2" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
