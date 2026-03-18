import React, { useState, useMemo, useCallback } from "react";
import { View, Text, SectionList, StyleSheet, Pressable, RefreshControl } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { isMultiDay, formatDateRange } from "@aura/shared/utils";
import { TaskIcon } from "../../components/TaskIcon";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { TaskItem } from "../../components/TaskItem";
import { FAB } from "../../components/FAB";
import { CreateTaskSheet } from "../../components/CreateTaskSheet";
import { useTheme } from "../../lib/theme";
import { parseInput } from "../../lib/api";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_CYCLE: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

const SPRING_CONFIG = { stiffness: 380, damping: 26 };

function MultiDayCard({
  task,
  onToggle,
  onPress,
  theme,
}: {
  task: Task;
  onToggle: (id: string, status: string) => void;
  onPress: (task: Task) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const status = task.status || "pending";
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";

  const pressed = useSharedValue(false);

  const borderColor = isCompleted
    ? theme.success
    : isInProgress
      ? theme.warning
      : theme.textTertiary;
  const bgColor = isCompleted
    ? theme.success
    : isInProgress
      ? theme.warning + "20"
      : "transparent";

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.97 : 1, SPRING_CONFIG) },
    ],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(borderColor, { duration: 250 }),
    backgroundColor: withTiming(bgColor, { duration: 250 }),
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { pressed.value = true; }}
      onPressOut={() => { pressed.value = false; }}
      onPress={() => onPress(task)}
      style={[
        styles.multiDayCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderSubtle,
        },
        cardAnimatedStyle,
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(task.id, STATUS_CYCLE[status] || "pending");
        }}
        hitSlop={8}
      >
        <Animated.View
          style={[
            styles.statusDot,
            dotAnimatedStyle,
          ]}
        >
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          {isInProgress && (
            <Text style={[styles.checkmark, { color: theme.warning, fontSize: 13 }]}>
              ◐
            </Text>
          )}
        </Animated.View>
      </Pressable>
      <TaskIcon icon={task.icon} color={task.icon_color} size={32} done={isCompleted} />
      <View style={styles.multiDayInfo}>
        <Text
          numberOfLines={1}
          style={[
            styles.multiDayTitle,
            {
              color: isCompleted ? theme.textSecondary : theme.text,
              textDecorationLine: isCompleted ? "line-through" : "none",
            },
          ]}
        >
          {task.title}
        </Text>
        <Text style={[styles.multiDayDate, { color: theme.textSecondary }]}>
          {formatDateRange(task.start_date, task.end_date)}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tasks, loading, fetchTasks, createBatch, createNote, updateStatus, deleteTask } =
    useTasks(monthKey);
  const [showCreate, setShowCreate] = useState(false);

  const sections = useMemo(() => {
    const allTasks = tasks.filter((t) => t.type === "task");

    const multiDay = allTasks.filter((t) =>
      t.start_date && isMultiDay(t.start_date, t.end_date)
    );
    const inbox = allTasks.filter((t) => !t.start_date);
    const pending = allTasks
      .filter(
        (t) =>
          t.start_date &&
          t.status !== "completed" &&
          !isMultiDay(t.start_date, t.end_date)
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const completed = allTasks.filter(
      (t) =>
        t.start_date &&
        t.status === "completed" &&
        !isMultiDay(t.start_date, t.end_date)
    );

    const result: { title: string; data: Task[]; isMultiDay?: boolean }[] = [];
    if (multiDay.length > 0)
      result.push({ title: "多日任务", data: multiDay, isMultiDay: true });
    if (inbox.length > 0) result.push({ title: "收件箱", data: inbox });
    if (pending.length > 0) result.push({ title: "待完成", data: pending });
    if (completed.length > 0)
      result.push({ title: "已完成", data: completed });
    return result;
  }, [tasks]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      router.push(`/task/${task.id}` as `/task/${string}`);
    },
    [router]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["left", "right"]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.background },
            ]}
          >
            <View style={styles.sectionTitleRow}>
              <View style={[styles.accentDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {title}
              </Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />
          </View>
        )}
        renderItem={({ item, section }) => {
          if ((section as { isMultiDay?: boolean }).isMultiDay) {
            return (
              <MultiDayCard
                task={item}
                onToggle={updateStatus}
                onPress={handleTaskPress}
                theme={theme}
              />
            );
          }
          return (
            <TaskItem
              task={item}
              onToggle={updateStatus}
              onPress={handleTaskPress}
              onDelete={deleteTask}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon]}>
              📝
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
              {loading ? "加载中..." : "暂无任务"}
            </Text>
            {!loading && (
              <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
                试试用自然语言创建一条任务
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchTasks}
            tintColor={theme.accent}
          />
        }
      />

      <FAB onPress={() => setShowCreate(true)} />

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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },
  accentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingBottom: 80,
  },
  empty: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 2,
  },
  multiDayCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  multiDayInfo: {
    flex: 1,
    gap: 2,
  },
  multiDayTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  multiDayDate: {
    fontSize: 12,
  },
});
