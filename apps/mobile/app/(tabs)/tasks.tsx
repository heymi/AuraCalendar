import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { View, Text, SectionList, StyleSheet, Pressable, RefreshControl } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import type { Task } from "@aura/shared/types";
import { isMultiDay, formatDateRange } from "@aura/shared/utils";
import { TaskIcon } from "../../components/TaskIcon";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { TaskItem } from "../../components/TaskItem";
import { BottomInputBar } from "../../components/BottomInputBar";
import { useTheme } from "../../lib/theme";
import { useTabBarHeight } from "../../lib/tab-bar-height";
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

type PendingSort = "date" | "created" | "status";

interface SectionMeta {
  title: string;
  /** Sliced data for display — only the visible portion */
  data: Task[];
  isMultiDay?: boolean;
  totalCount: number;
  isCollapsed: boolean;
  /** How many more items beyond data.length remain invisible */
  remainingCount: number;
  hiddenCompletedCount?: number;
}

const SORT_OPTIONS: { key: PendingSort; label: string; icon: string }[] = [
  { key: "date", label: "按日期", icon: "calendar" },
  { key: "created", label: "按创建时间", icon: "clock" },
  { key: "status", label: "按状态", icon: "circle.lefthalf.filled" },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_COLLAPSE_THRESHOLD = 5;
const COLLAPSED_PREVIEW_COUNT = 3;
const PAGE_SIZE = 15;

function SectionChevron({ collapsed, theme }: { collapsed: boolean; theme: ReturnType<typeof useTheme> }) {
  const rotation = useSharedValue(collapsed ? 0 : 1);
  useEffect(() => {
    rotation.value = withSpring(collapsed ? 0 : 1, { stiffness: 400, damping: 28 });
  }, [collapsed]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));
  return (
    <Animated.View style={animStyle}>
      <SymbolView name="chevron.right" size={12} tintColor={theme.textTertiary} />
    </Animated.View>
  );
}

export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tabBarHeight } = useTabBarHeight();
  const { tasks, loading, fetchTasks, createBatch, createNote, updateStatus, deleteTask } =
    useTasks(monthKey);

  const BOTTOM_INSET = tabBarHeight + 16;

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({ "已完成": true });
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [pendingSort, setPendingSort] = useState<PendingSort>("date");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState({ top: 0, right: 0 });
  /** Per-section page limit when expanded (key = section title) */
  const [sectionLimits, setSectionLimits] = useState<Record<string, number>>({});
  const manuallyToggled = useRef<Set<string>>(new Set());
  const sortButtonRef = useRef<View>(null);

  const toggleSection = useCallback((title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    manuallyToggled.current.add(title);
    setCollapsedSections((prev) => {
      const wasCollapsed = prev[title] ?? false;
      if (wasCollapsed) {
        // Expanding — set initial page limit
        setSectionLimits((l) => ({ ...l, [title]: COLLAPSED_PREVIEW_COUNT + PAGE_SIZE }));
      } else {
        // Collapsing — reset limit
        setSectionLimits((l) => ({ ...l, [title]: COLLAPSED_PREVIEW_COUNT }));
      }
      return { ...prev, [title]: !wasCollapsed };
    });
  }, []);

  const loadMoreInSection = useCallback((title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSectionLimits((prev) => ({
      ...prev,
      [title]: (prev[title] ?? COLLAPSED_PREVIEW_COUNT + PAGE_SIZE) + PAGE_SIZE,
    }));
  }, []);

  const openSortMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sortButtonRef.current?.measureInWindow((x, y, width, height) => {
      setSortMenuPosition({ top: y + height + 4, right: 16 });
      setShowSortMenu(true);
    });
  }, []);

  const sections = useMemo(() => {
    const allTasks = tasks.filter((t) => t.type === "task");
    const now = Date.now();

    const multiDay = allTasks.filter((t) =>
      t.start_date && isMultiDay(t.start_date, t.end_date)
    );
    const inbox = allTasks.filter((t) => !t.start_date);

    const pendingTasks = allTasks
      .filter(
        (t) =>
          t.start_date &&
          t.status !== "completed" &&
          !isMultiDay(t.start_date, t.end_date)
      )
      .sort((a, b) => {
        if (pendingSort === "date") return a.start_date.localeCompare(b.start_date);
        if (pendingSort === "created") return a.created_at.localeCompare(b.created_at);
        const order: Record<string, number> = { in_progress: 0, pending: 1 };
        const diff = (order[a.status] ?? 1) - (order[b.status] ?? 1);
        return diff !== 0 ? diff : a.start_date.localeCompare(b.start_date);
      });

    const allCompleted = allTasks.filter(
      (t) =>
        t.start_date &&
        t.status === "completed" &&
        !isMultiDay(t.start_date, t.end_date)
    );
    let hiddenCompletedCount = 0;
    const completed = showAllCompleted
      ? allCompleted
      : allCompleted.filter((t) => {
          const age = now - new Date(t.updated_at).getTime();
          if (age > SEVEN_DAYS_MS) {
            hiddenCompletedCount++;
            return false;
          }
          return true;
        });

    const buildSection = (
      title: string,
      fullData: Task[],
      extra?: { isMultiDay?: boolean; hiddenCompletedCount?: number }
    ): SectionMeta | null => {
      if (fullData.length === 0) return null;
      const wasManuallyToggled = manuallyToggled.current.has(title);
      const isCollapsed = wasManuallyToggled
        ? collapsedSections[title] ?? false
        : fullData.length > AUTO_COLLAPSE_THRESHOLD
          ? (collapsedSections[title] ?? true)
          : (collapsedSections[title] ?? false);

      const limit = isCollapsed
        ? COLLAPSED_PREVIEW_COUNT
        : (sectionLimits[title] ?? fullData.length);
      const visibleData = fullData.slice(0, limit);

      return {
        title,
        data: visibleData,
        totalCount: fullData.length,
        isCollapsed,
        remainingCount: fullData.length - visibleData.length,
        ...extra,
      };
    };

    return [
      buildSection("多日任务", multiDay, { isMultiDay: true }),
      buildSection("收件箱", inbox),
      buildSection("待完成", pendingTasks),
      buildSection("已完成", completed, { hiddenCompletedCount }),
    ].filter((s): s is SectionMeta => s !== null);
  }, [tasks, pendingSort, showAllCompleted, collapsedSections, sectionLimits]);

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
        onScrollBeginDrag={() => setShowSortMenu(false)}
        renderSectionHeader={({ section }) => {
          const { title, totalCount, isCollapsed } = section as SectionMeta;
          return (
            <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
              <View style={styles.sectionHeaderRow}>
                <Pressable onPress={() => toggleSection(title)} style={styles.sectionTitleTouchable}>
                  <View style={[styles.accentDot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    {title}
                  </Text>
                  {totalCount > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: theme.accent + "12" }]}>
                      <Text style={[styles.countBadgeText, { color: theme.accent }]}>
                        {totalCount}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <SectionChevron collapsed={isCollapsed} theme={theme} />
                </Pressable>
                {title === "待完成" && (
                  <Pressable
                    ref={sortButtonRef}
                    onPress={openSortMenu}
                    hitSlop={8}
                    style={[styles.sortButton, { position: "relative" }]}
                  >
                    <SymbolView
                      name="arrow.up.arrow.down"
                      size={14}
                      tintColor={pendingSort !== "date" ? theme.accent : theme.textSecondary}
                    />
                    {pendingSort !== "date" && (
                      <View style={[styles.sortActiveDot, { backgroundColor: theme.accent }]} />
                    )}
                  </Pressable>
                )}
              </View>
              <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />
            </View>
          );
        }}
        renderSectionFooter={({ section }) => {
          const { title, totalCount, isCollapsed, remainingCount, hiddenCompletedCount } = section as SectionMeta;
          const collapsedRemaining = totalCount - COLLAPSED_PREVIEW_COUNT;
          const showExpandButton = isCollapsed && collapsedRemaining > 0;
          const showLoadMore = !isCollapsed && remainingCount > 0;
          const showCompletedToggle = title === "已完成" && ((hiddenCompletedCount ?? 0) > 0 || showAllCompleted);

          if (!showExpandButton && !showLoadMore && !showCompletedToggle) return null;

          return (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.sectionFooter}>
              {showExpandButton && (
                <Pressable
                  onPress={() => toggleSection(title)}
                  style={[styles.footerButton, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
                >
                  <SymbolView name="chevron.down" size={10} tintColor={theme.accent} />
                  <Text style={[styles.footerText, { color: theme.accent }]}>
                    展开剩余 {collapsedRemaining} 条
                  </Text>
                </Pressable>
              )}
              {showLoadMore && (
                <Pressable
                  onPress={() => loadMoreInSection(title)}
                  style={[styles.footerButton, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
                >
                  <SymbolView name="chevron.down" size={10} tintColor={theme.accent} />
                  <Text style={[styles.footerText, { color: theme.accent }]}>
                    加载更多 ({remainingCount})
                  </Text>
                </Pressable>
              )}
              {showCompletedToggle && !showAllCompleted && (hiddenCompletedCount ?? 0) > 0 && (
                <Pressable
                  onPress={() => setShowAllCompleted(true)}
                  style={[styles.footerButton, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
                >
                  <SymbolView name="chevron.down" size={10} tintColor={theme.textSecondary} />
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    显示全部已完成 ({hiddenCompletedCount})
                  </Text>
                </Pressable>
              )}
              {showCompletedToggle && showAllCompleted && (
                <Pressable
                  onPress={() => setShowAllCompleted(false)}
                  style={[styles.footerButton, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
                >
                  <SymbolView name="chevron.up" size={10} tintColor={theme.textSecondary} />
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    隐藏旧任务
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          );
        }}
        renderItem={({ item, section }) => {
          const meta = section as SectionMeta;
          if (meta.isMultiDay) {
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
            <SymbolView name="checklist" size={40} tintColor={theme.textTertiary} />
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
        contentContainerStyle={{ paddingBottom: BOTTOM_INSET }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchTasks}
            tintColor={theme.accent}
          />
        }
      />

      {/* Sort Menu Popover */}
      {showSortMenu && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSortMenu(false)}
          />
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[
              styles.sortPopover,
              {
                top: sortMenuPosition.top,
                right: sortMenuPosition.right,
                backgroundColor: theme.elevated,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sortMenuTitle, { color: theme.textSecondary }]}>排序方式</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPendingSort(opt.key);
                  setShowSortMenu(false);
                }}
                style={[
                  styles.sortOption,
                  pendingSort === opt.key && { backgroundColor: theme.accent + "15" },
                ]}
              >
                <SymbolView name={opt.icon as "calendar"} size={16} tintColor={pendingSort === opt.key ? theme.accent : theme.textSecondary} />
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: pendingSort === opt.key ? theme.accent : theme.text },
                  ]}
                >
                  {opt.label}
                </Text>
                {pendingSort === opt.key && (
                  <SymbolView name="checkmark" size={14} tintColor={theme.accent} />
                )}
              </Pressable>
            ))}
          </Animated.View>
        </>
      )}

      <BottomInputBar
        onCreateBatch={createBatch}
        onCreateNote={createNote}
        parseInput={parseInput}
      />
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 8,
  },
  sectionTitleTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  countBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
  },
  sortButton: {
    padding: 4,
    marginLeft: 4,
  },
  sortActiveDot: {
    position: "absolute",
    top: 2,
    right: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionFooter: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sortPopover: {
    position: "absolute",
    width: 220,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    overflow: "hidden",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  sortMenuTitle: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  empty: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
    marginTop: 8,
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
