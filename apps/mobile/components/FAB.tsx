import React, { useEffect } from "react";
import { Pressable, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { useTheme } from "../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BREATH_DURATION = 2500;
const BREATH_SCALE_PEAK = 1.06;
const BREATH_EASING = Easing.bezier(0.45, 0, 0.55, 1); // sine-like

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  const theme = useTheme();

  const breathProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  // Start the breathing loop on mount
  useEffect(() => {
    breathProgress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: BREATH_DURATION / 2,
          easing: BREATH_EASING,
        }),
        withTiming(0, {
          duration: BREATH_DURATION / 2,
          easing: BREATH_EASING,
        })
      ),
      -1, // infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Breathing produces a gentle 1.0 → 1.06 → 1.0 oscillation
    const breathScale = interpolate(breathProgress.value, [0, 1], [1, BREATH_SCALE_PEAK]);

    // When pressed, suppress breathing — pressScale dominates
    const finalScale = isPressed.value
      ? pressScale.value
      : pressScale.value * breathScale;

    return {
      transform: [{ scale: finalScale }],
    };
  });

  // Shadow opacity pulses with breathing
  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(breathProgress.value, [0, 1], [0.0, 0.28]);

    if (Platform.OS === "ios") {
      return {
        shadowOpacity: isPressed.value ? 0 : shadowOpacity,
      };
    }
    // Android: elevation approximation
    return {
      elevation: isPressed.value ? 0 : interpolate(breathProgress.value, [0, 1], [0, 6]),
    };
  });

  const handlePressIn = () => {
    isPressed.value = true;
    pressScale.value = withSpring(0.88, { stiffness: 400, damping: 25 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      stiffness: 400,
      damping: 25,
    });
    // Resume breathing after spring settles — slight delay keeps it smooth
    setTimeout(() => {
      isPressed.value = false;
    }, 200);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        {
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 12,
        },
        animatedStyle,
        shadowStyle,
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        style={styles.glassBackground}
      />
      <Text style={[styles.icon, { color: theme.accent }]}>+</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 96,
    zIndex: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 32,
  },
});
