import React, { useMemo, useCallback } from "react";
import { View, Text, SectionList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import type { Task } from "@aura/shared/types";
import { isMultiDay } from "@aura/shared/utils";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { TaskItem } from "../../components/TaskItem";
import { ChatInput } from "../../components/ChatInput";
import { useTheme } from "../../lib/theme";
import { parseInput } from "../../lib/api";

export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tasks, loading, createBatch, updateStatus, deleteTask } =
    useTasks(monthKey);

  const sections = useMemo(() => {
    const activeTasks = tasks.filter(
      (t) => t.type === "task" && t.start_date
    );

    const multiDay = activeTasks.filter((t) => isMultiDay(t.start_date, t.end_date));
    const inbox = tasks.filter((t) => t.type === "task" && !t.start_date);
    const pending = activeTasks
      .filter((t) => t.status !== "completed" && !isMultiDay(t.start_date, t.end_date))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const completed = activeTasks
      .filter((t) => t.status === "completed" && !isMultiDay(t.start_date, t.end_date));

    const result = [];
    if (inbox.length > 0) result.push({ title: "收件箱", data: inbox });
    if (multiDay.length > 0) result.push({ title: "多日任务", data: multiDay });
    if (pending.length > 0) result.push({ title: "待完成", data: pending });
    if (completed.length > 0) result.push({ title: "已完成", data: completed });
    return result;
  }, [tasks]);

  const handleTaskPress = useCallback(
    (task: Task) => {
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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={updateStatus}
            onPress={handleTaskPress}
            onDelete={deleteTask}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              {loading ? "加载中..." : "暂无任务"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <ChatInput onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 16,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
});
