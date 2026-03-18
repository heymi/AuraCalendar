import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { COLOR_PALETTE } from "@aura/shared/icons";
import { useTheme } from "../lib/theme";

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>颜色</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {COLOR_PALETTE.map((color) => (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.swatch,
              {
                backgroundColor: color,
                borderWidth: selected === color ? 3 : 0,
                borderColor: theme.text,
              },
            ]}
          >
            {selected === color && (
              <Text style={styles.check}>✓</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    gap: 10,
    paddingVertical: 4,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
