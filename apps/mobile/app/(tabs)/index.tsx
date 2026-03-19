import React, { useState, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { CalendarList } from "../../components/CalendarGrid";
import { DayDetailSheet } from "../../components/DayDetailSheet";
import { BottomInputBar } from "../../components/BottomInputBar";
import { useTheme } from "../../lib/theme";
import { parseInput } from "../../lib/api";

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tasks, fetchTasks, createBatch, createNote, updateStatus, deleteTask } =
    useTasks(monthKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayPress = useCallback((date: string) => {
    Haptics.selectionAsync();
    setSelectedDate(date);
  }, []);

  const handleTaskPress = useCallback(
    (task: Task) => {
      setSelectedDate(null);
      if (task.type === "note") {
        router.push(`/note/${task.id}` as `/note/${string}`);
      } else {
        router.push(`/task/${task.id}` as `/task/${string}`);
      }
    },
    [router]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["left", "right"]}
    >
      <CalendarList
        tasks={tasks}
        onDayPress={handleDayPress}
        onRefresh={fetchTasks}
        refreshing={false}
      />

      <BottomInputBar
        onCreateBatch={createBatch}
        onCreateNote={createNote}
        parseInput={parseInput}
      />

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
});
