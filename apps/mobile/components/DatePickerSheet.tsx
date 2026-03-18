import React from "react";
import { View, Text, StyleSheet, Platform, Pressable, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../lib/theme";

interface DatePickerSheetProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  title?: string;
}

export function DatePickerSheet({
  value,
  onChange,
  onClose,
  title = "选择日期",
}: DatePickerSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
          </Pressable>
        </View>
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedDate) => {
            if (selectedDate) onChange(selectedDate);
          }}
          themeVariant={theme.background === "#000000" ? "dark" : "light"}
          style={styles.picker}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: "600",
  },
  picker: {
    alignSelf: "center",
  },
});
