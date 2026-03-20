"use client";

import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme";
import Constants from "expo-constants";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleLogout = () => {
    Alert.alert("退出登录", "确定要退出当前账号吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* User card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
        ]}
      >
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[styles.avatar, { backgroundColor: theme.borderSubtle }]}
          />
        )}
        <Text style={[styles.userName, { color: theme.text }]}>
          {user?.name ?? "未登录"}
        </Text>
        <Text style={[styles.userId, { color: theme.textSecondary }]}>
          GitHub ID: {user?.id ?? "-"}
        </Text>
      </View>

      {/* Settings rows */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
        ]}
      >
        <SettingsRow
          icon="info.circle"
          label="关于"
          value={`v${appVersion}`}
          theme={theme}
        />
      </View>

      {/* Logout */}
      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={[styles.logoutText, { color: theme.danger }]}>
          退出登录
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: SFSymbol;
  label: string;
  value?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.row}>
      <SymbolView name={icon} tintColor={theme.textSecondary} size={20} />
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {value && (
        <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    fontWeight: "400",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
    width: "100%",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "400",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 32,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
