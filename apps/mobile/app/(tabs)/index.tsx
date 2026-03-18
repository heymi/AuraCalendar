import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { CalendarList } from "../../components/CalendarGrid";
import { DayDetailSheet } from "../../components/DayDetailSheet";
import { FAB } from "../../components/FAB";
import { CreateTaskSheet } from "../../components/CreateTaskSheet";
import { useTheme } from "../../lib/theme";
import { parseInput } from "../../lib/api";

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tasks, loading, fetchTasks, createBatch, createNote, updateStatus, deleteTask } =
    useTasks(monthKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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

      <FAB onPress={() => setShowCreate(true)} />

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

      {showCreate && (
        <CreateTaskSheet
          onClose={() => setShowCreate(false)}
          onCreateBatch={createBatch}
          onCreateNote={createNote}
          parseInput={parseInput}
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
