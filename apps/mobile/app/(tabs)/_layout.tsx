import React, { useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme, type Theme } from "../../lib/theme";
import { useAuth } from "../../lib/auth-context";
import { TabBarHeightProvider, useTabBarHeight } from "../../lib/tab-bar-height";
import { InputBarProvider, useInputBar } from "../../lib/input-bar-context";

const SPRING = { damping: 28, stiffness: 380 };
const TAB_COUNT = 3;

function TabIcon({
  name,
  focused,
  theme,
}: {
  name: string;
  focused: boolean;
  theme: Theme;
}) {
  const scale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + 0.15 * scale.value }],
    opacity: 0.5 + 0.5 * scale.value,
  }));

  const color = focused ? theme.accent : theme.textSecondary;

  return (
    <Animated.View style={animatedStyle}>
      <SymbolView name={name} tintColor={color} size={22} />
    </Animated.View>
  );
}

function TabLabel({ focused, label, theme }: { focused: boolean; label: string; theme: Theme }) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + 0.55 * progress.value,
    transform: [{ translateY: -1 * progress.value }],
  }));

  return (
    <Animated.Text
      style={[
        styles.tabLabel,
        { color: focused ? theme.accent : theme.textSecondary },
        focused && styles.tabLabelActive,
        style,
      ]}
    >
      {label}
    </Animated.Text>
  );
}

function PlusButton({ theme }: { theme: Theme }) {
  const { isOpen, open, close } = useInputBar();

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(isOpen ? 1 : 0, SPRING);
  }, [isOpen]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 45}deg` }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    console.log("[PlusButton] pressed, isOpen:", isOpen);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  return (
    <Animated.View style={[styles.plusWrapper, pressStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.9, SPRING); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING); }}
        style={styles.plusPressable}
      >
        <GlassView
          glassEffectStyle="regular"
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={iconStyle}>
          <SymbolView
            name="plus"
            tintColor={isOpen ? theme.accent : theme.text}
            size={22}
            weight="medium"
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { onTabBarLayout } = useTabBarHeight();

  const barWidth = useSharedValue(0);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const tabWidth = barWidth.value / TAB_COUNT;
    indicatorX.value = withSpring(state.index * tabWidth, SPRING);
  }, [state.index, barWidth.value]);

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    barWidth.value = w;
    indicatorX.value = state.index * (w / TAB_COUNT);
  }, []);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = barWidth.value / TAB_COUNT;
    return {
      width: tabWidth - 8,
      transform: [{ translateX: indicatorX.value + 4 }],
    };
  });

  return (
    <View
      style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}
      onLayout={onTabBarLayout}
    >
      <View style={styles.tabBarRow}>
        {/* Tab bar — 70% width */}
        <GlassView
          isInteractive
          glassEffectStyle="regular"
          style={styles.tabBarGlass}
        >
          <View style={styles.tabBarInner} onLayout={onBarLayout}>
            <Animated.View style={[styles.indicator, indicatorStyle]} />

            {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = options.title ?? route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate(route.name, route.params);
                }
              };

              return (
                <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: isFocused ? theme.accent : theme.textSecondary,
                    size: 22,
                  })}
                  <TabLabel focused={isFocused} label={label} theme={theme} />
                </Pressable>
              );
            })}
          </View>
        </GlassView>

        {/* Plus button */}
        <PlusButton theme={theme} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const theme = useTheme();
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  if (loading || !token) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <TabBarHeightProvider>
      <InputBarProvider>
        <Tabs
          tabBar={(props) => <LiquidGlassTabBar {...props} />}
          screenOptions={{
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
              tabBarIcon: ({ focused }) => (
                <TabIcon name="calendar" focused={focused} theme={theme} />
              ),
            }}
          />
          <Tabs.Screen
            name="tasks"
            options={{
              title: "清单",
              tabBarIcon: ({ focused }) => (
                <TabIcon name="list.bullet" focused={focused} theme={theme} />
              ),
            }}
          />
          <Tabs.Screen
            name="notes"
            options={{
              title: "笔记",
              tabBarIcon: ({ focused }) => (
                <TabIcon name="square.and.pencil" focused={focused} theme={theme} />
              ),
            }}
          />
        </Tabs>
      </InputBarProvider>
    </TabBarHeightProvider>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
  },
  tabBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabBarGlass: {
    flex: 1,
    borderRadius: 28,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabBarInner: {
    flexDirection: "row",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 0,
    borderRadius: 22,
    backgroundColor: "rgba(120, 120, 128, 0.15)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 2,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  tabLabelActive: {
    fontWeight: "600",
  },
  plusWrapper: {
    width: 52,
    height: 52,
  },
  plusPressable: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
