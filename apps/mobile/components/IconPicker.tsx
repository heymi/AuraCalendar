import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { LEGACY_EMOJI_MAP } from "@aura/shared/icons";
import { useTheme } from "../lib/theme";

const EMOJI_LIST = Object.values(LEGACY_EMOJI_MAP);

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>图标</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {EMOJI_LIST.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => onSelect(emoji)}
            style={[
              styles.item,
              {
                backgroundColor:
                  selected === emoji ? theme.accent + "18" : theme.background,
                borderColor:
                  selected === emoji ? theme.accent : theme.borderSubtle,
              },
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
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
  grid: {
    gap: 8,
    paddingVertical: 4,
  },
  item: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
  },
});
