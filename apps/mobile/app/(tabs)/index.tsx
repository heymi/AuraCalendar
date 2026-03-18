import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { CalendarGrid } from "../../components/CalendarGrid";
import { DayDetailSheet } from "../../components/DayDetailSheet";
import { ChatInput } from "../../components/ChatInput";
import { useTheme } from "../../lib/theme";
import { parseInput } from "../../lib/api";

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { year, month, monthKey, goToPrevMonth, goToNextMonth, goToToday } =
    useCalendar();
  const { tasks, loading, createBatch, updateStatus, deleteTask } =
    useTasks(monthKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthLabel = `${year}年${month}月`;

  const handleDayPress = useCallback((date: string) => {
    Haptics.selectionAsync();
    setSelectedDate(date);
  }, []);

  const handleTaskPress = useCallback(
    (task: Task) => {
      setSelectedDate(null);
      router.push(`/task/${task.id}` as `/task/${string}`);
    },
    [router]
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      const parsed = await parseInput(text);
      if (Array.isArray(parsed)) {
        await createBatch(text, parsed);
      }
    },
    [createBatch]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["left", "right"]}>
      {/* Calendar header */}
      <View style={styles.header}>
        <Pressable onPress={goToPrevMonth} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.accent }]}>‹</Text>
        </Pressable>
        <Pressable onPress={goToToday}>
          <Text style={[styles.monthTitle, { color: theme.text }]}>{monthLabel}</Text>
        </Pressable>
        <Pressable onPress={goToNextMonth} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.accent }]}>›</Text>
        </Pressable>
      </View>

      {/* Calendar grid */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loading}>
            <Text style={{ color: theme.textSecondary }}>加载中...</Text>
          </View>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            tasks={tasks}
            onDayPress={handleDayPress}
          />
        )}
      </ScrollView>

      {/* Chat input */}
      <ChatInput onSubmit={handleSubmit} />

      {/* Day detail bottom sheet */}
      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          tasks={tasks}
          onClose={() => setSelectedDate(null)}
          onToggle={updateStatus}
          onPress={handleTaskPress}
          onDelete={deleteTask}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 20,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  navBtn: {
    fontSize: 28,
    fontWeight: "300",
    paddingHorizontal: 8,
  },
  scrollContent: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
});
