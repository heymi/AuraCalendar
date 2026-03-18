import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { stiffness: 340, damping: 28, mass: 1 };

export default function LoginScreen() {
  const theme = useTheme();
  const { login, loading } = useAuth();
  const router = useRouter();

  // Entrance animation drivers (0 → 1)
  const emojiProgress = useSharedValue(0);
  const titleProgress = useSharedValue(0);
  const subtitleProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  // Continuous breathing for emoji
  const emojiFloat = useSharedValue(0);

  // Button press scale
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance choreography
    emojiProgress.value = withSpring(1, { stiffness: 300, damping: 22, mass: 1 });

    titleProgress.value = withDelay(
      200,
      withSpring(1, SPRING_CONFIG)
    );

    subtitleProgress.value = withDelay(
      350,
      withSpring(1, SPRING_CONFIG)
    );

    buttonProgress.value = withDelay(
      500,
      withSpring(1, SPRING_CONFIG)
    );

    // Start breathing after entrance settles (~600ms)
    emojiFloat.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true // reverse
      )
    );
  }, []);

  // --- Animated styles ---

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(emojiProgress.value, [0, 1], [0.5, 1]) },
      { translateY: emojiFloat.value },
    ],
    opacity: emojiProgress.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(titleProgress.value, [0, 1], [20, 0]) },
    ],
    opacity: titleProgress.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(subtitleProgress.value, [0, 1], [16, 0]) },
    ],
    opacity: subtitleProgress.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(buttonProgress.value, [0, 1], [24, 0]) },
      { scale: buttonScale.value },
    ],
    opacity: buttonProgress.value,
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { stiffness: 400, damping: 20 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { stiffness: 400, damping: 20 });
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        <Animated.Text style={[styles.logo, emojiStyle]}>✨</Animated.Text>
        <Animated.Text style={[styles.title, { color: theme.text }, titleStyle]}>
          AuraCalendar
        </Animated.Text>
        <Animated.Text
          style={[styles.subtitle, { color: theme.textSecondary }, subtitleStyle]}
        >
          极简任务日历
        </Animated.Text>
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          onPress={handleLogin}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.loginBtn,
            { backgroundColor: theme.text },
            buttonAnimStyle,
          ]}
        >
          <Text style={[styles.loginText, { color: theme.background }]}>
            使用 GitHub 登录
          </Text>
        </AnimatedPressable>
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
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: 0.2,
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
