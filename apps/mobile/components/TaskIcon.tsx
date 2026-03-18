import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { resolveEmoji } from "@aura/shared/icons";

interface TaskIconProps {
  icon: string;
  color: string;
  size?: number;
}

export function TaskIcon({ icon, color, size = 32 }: TaskIconProps) {
  const emoji = resolveEmoji(icon);
  const fontSize = size * 0.5;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: color + "18",
        },
      ]}
    >
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
