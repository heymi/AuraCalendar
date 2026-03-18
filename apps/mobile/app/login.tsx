import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme";

export default function LoginScreen() {
  const theme = useTheme();
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    await login();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <Text style={styles.logo}>✨</Text>
        <Text style={[styles.title, { color: theme.text }]}>AuraCalendar</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          极简任务日历
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.loginBtn,
            {
              backgroundColor: theme.text,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Text style={[styles.loginText, { color: theme.background }]}>
            使用 GitHub 登录
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
  },
  actions: {
    gap: 12,
  },
  loginBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
