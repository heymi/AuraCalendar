import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import dayjs from "dayjs";
import type { Task } from "@aura/shared/types";
import { TaskItem } from "./TaskItem";
import { useTheme } from "../lib/theme";

interface DayDetailSheetProps {
  date: string | null;
  tasks: Task[];
  onClose: () => void;
  onToggle: (id: string, status: string) => void;
  onPress: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function DayDetailSheet({
  date,
  tasks,
  onClose,
  onToggle,
  onPress,
  onDelete,
}: DayDetailSheetProps) {
  const theme = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%", "70%"], []);

  const dayTasks = useMemo(() => {
    if (!date) return [];
    return tasks.filter((t) => {
      if (!t.start_date || t.type === "note") return false;
      const start = t.start_date;
      const end = t.end_date || start;
      return date >= start && date <= end;
    });
  }, [date, tasks]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
  );

  if (!date) return null;

  const formatted = dayjs(date).format("M月D日 dddd");

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.textTertiary }}
    >
      <View style={styles.header}>
        <Text style={[styles.dateTitle, { color: theme.text }]}>{formatted}</Text>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {dayTasks.length} 项任务
        </Text>
      </View>

      <FlatList
        data={dayTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={onToggle}
            onPress={onPress}
            onDelete={onDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              这天没有任务
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 2,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 14,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
