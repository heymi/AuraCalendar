import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  type ViewToken,
  type ViewabilityConfigCallbackPairs,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import dayjs from "dayjs";
import type { Task } from "@aura/shared/types";
import { GlassView } from "expo-glass-effect";
import { TaskIcon } from "./TaskIcon";
import { useTheme, type Theme } from "../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SCREEN_WIDTH = Dimensions.get("window").width;

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const SPRING_PRESS = { stiffness: 400, damping: 25, mass: 0.8 };
const SPRING_FAB = { stiffness: 350, damping: 28, mass: 0.9 };

interface DayCardData {
  date: string;
  dayjs: dayjs.Dayjs;
  tasks: Task[];
  notes: Task[];
  isToday: boolean;
  isPast: boolean;
  isFirstOfMonth: boolean;
}

interface CalendarListProps {
  tasks: Task[];
  onDayPress: (date: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function generateDays(tasks: Task[], range: number = 30, past: number = 14): DayCardData[] {
  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");
  const days: DayCardData[] = [];

  for (let i = -past; i <= range; i++) {
    const d = today.add(i, "day");
    const dateStr = d.format("YYYY-MM-DD");

    const dayTasks = tasks.filter((t) => {
      if (!t.start_date || t.type === "note") return false;
      const start = t.start_date;
      const end = t.end_date || start;
      return dateStr >= start && dateStr <= end;
    });

    const dayNotes = tasks.filter((t) => {
      if (t.type !== "note") return false;
      const noteDate = t.start_date || t.created_at?.slice(0, 10);
      return noteDate === dateStr;
    });

    days.push({
      date: dateStr,
      dayjs: d,
      tasks: dayTasks,
      notes: dayNotes,
      isToday: dateStr === todayStr,
      isPast: d.isBefore(today, "day"),
      isFirstOfMonth: d.date() === 1,
    });
  }

  return days;
}

function MonthLabel({ date, theme }: { date: dayjs.Dayjs; theme: Theme }) {
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={styles.monthLabel}
    >
      <Text style={[styles.monthLabelText, { color: theme.text }]}>
        {date.format("YYYY年M月")}
      </Text>
      <View style={[styles.monthLabelRule, { backgroundColor: theme.borderSubtle }]} />
    </Animated.View>
  );
}

function DayCard({
  item,
  onPress,
  theme,
  index,
}: {
  item: DayCardData;
  onPress: (date: string) => void;
  theme: Theme;
  index: number;
}) {
  const hasContent = item.tasks.length > 0 || item.notes.length > 0;
  const isCurrentWeek = Math.abs(item.dayjs.diff(dayjs(), "day")) <= 3;
  const isCompact = !isCurrentWeek && !item.isToday;

  // Press animation with spring physics
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_PRESS);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_PRESS);
  }, [scale]);

  // Split single-day vs multi-day tasks
  const singleDay = item.tasks.filter(
    (t) => !t.end_date || t.end_date === t.start_date
  );
  const multiDay = item.tasks.filter(
    (t) => t.end_date && t.end_date !== t.start_date
  );

  const maxVisible = isCompact ? 2 : 4;
  const iconSize = isCompact ? 16 : 20;
  const visibleSingle = singleDay.slice(0, maxVisible);
  const overflow = singleDay.length - maxVisible;

  // Stagger delay capped to avoid excessive waits on long lists
  const staggerDelay = Math.min(index * 30, 300);

  return (
    <>
      {item.isFirstOfMonth && <MonthLabel date={item.dayjs} theme={theme} />}
      <Animated.View
        entering={FadeInUp.delay(staggerDelay).duration(280).springify().stiffness(350).damping(28)}
      >
        <AnimatedPressable
          onPress={() => onPress(item.date)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            animatedStyle,
            styles.dayCard,
            {
              backgroundColor: theme.surface,
              borderColor: item.isToday ? "transparent" : theme.borderSubtle,
              borderWidth: 1,
              borderLeftWidth: item.isToday ? 3 : 1,
              borderLeftColor: item.isToday ? theme.accent : theme.borderSubtle,
              opacity: item.isPast && !item.isToday ? 0.55 : 1,
              minHeight: isCompact ? 48 : 68,
            },
          ]}
        >
          {/* Left: date info */}
          <View
            style={[
              styles.dateSection,
              { width: isCompact ? 40 : 52 },
            ]}
          >
            <Text
              style={[
                styles.weekdayLabel,
                {
                  color: item.isToday ? theme.accent : theme.textSecondary,
                  fontSize: isCompact ? 9 : 10,
                },
              ]}
            >
              {WEEKDAY_LABELS[item.dayjs.day()]}
            </Text>
            <Text
              style={[
                styles.dateNumber,
                {
                  color: item.isToday ? theme.accent : theme.text,
                  fontSize: item.isToday ? 32 : isCompact ? 18 : 28,
                  fontWeight: item.isToday ? "800" : "600",
                },
              ]}
            >
              {item.dayjs.date()}
            </Text>
            {item.isToday && !isCompact && (
              <View style={[styles.todayPill, { backgroundColor: theme.accent }]}>
                <Text style={styles.todayPillText}>今天</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: item.isToday ? theme.accent + "30" : theme.borderSubtle },
            ]}
          />

          {/* Right: task content */}
          <View style={styles.contentSection}>
            {!hasContent ? (
              <Text style={[styles.emptyText, { color: theme.textTertiary, fontStyle: "italic" }]}>
                暂无任务
              </Text>
            ) : isCompact ? (
              /* Collapsed: icons only, horizontal */
              <View style={styles.compactIconRow}>
                {item.tasks.slice(0, 2).map((t) => (
                  <TaskIcon
                    key={t.id}
                    icon={t.icon}
                    color={t.icon_color}
                    size={iconSize}
                    done={t.status === "completed"}
                  />
                ))}
                {item.tasks.length > 2 && (
                  <Text style={[styles.moreText, { color: theme.textSecondary }]}>
                    +{item.tasks.length - 2}
                  </Text>
                )}
              </View>
            ) : (
              /* Expanded: icon + title per row, vertical */
              <>
                {visibleSingle.map((t) => {
                  const done = t.status === "completed";
                  return (
                    <View key={t.id} style={styles.taskRow}>
                      <TaskIcon
                        icon={t.icon}
                        color={t.icon_color}
                        size={iconSize}
                        done={done}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.taskTitle,
                          {
                            color: "#999",
                            textDecorationLine: done ? "line-through" : "none",
                          },
                        ]}
                      >
                        {t.title}
                      </Text>
                    </View>
                  );
                })}
                {overflow > 0 && (
                  <Text style={[styles.overflowText, { color: theme.textSecondary }]}>
                    +{overflow} 更多
                  </Text>
                )}
                {/* Multi-day: icons only, horizontal row */}
                {multiDay.length > 0 && (
                  <View style={styles.compactIconRow}>
                    {multiDay.map((t) => (
                      <TaskIcon
                        key={t.id}
                        icon={t.icon}
                        color={t.icon_color}
                        size={iconSize}
                        done={t.status === "completed"}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </AnimatedPressable>
      </Animated.View>
    </>
  );
}

function LoadMoreButton({
  label,
  onPress,
  theme,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_PRESS);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_PRESS);
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.loadMoreBtn,
        { backgroundColor: theme.borderSubtle },
      ]}
    >
      <Text style={[styles.loadMoreText, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const ESTIMATED_ITEM_HEIGHT = 74;

export function CalendarList({ tasks, onDayPress, onRefresh, refreshing }: CalendarListProps) {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [pastCount, setPastCount] = useState(14);
  const [futureCount, setFutureCount] = useState(30);
  const isTodayVisibleRef = useRef(true);
  const [isTodayVisible, setIsTodayVisible] = useState(true);

  const days = useMemo(() => generateDays(tasks, futureCount, pastCount), [tasks, futureCount, pastCount]);

  const todayIndex = useMemo(
    () => days.findIndex((d) => d.isToday),
    [days]
  );

  const todayDateRef = useRef(dayjs().format("YYYY-MM-DD"));

  const renderItem = useCallback(
    ({ item, index }: { item: DayCardData; index: number }) => (
      <DayCard item={item} onPress={onDayPress} theme={theme} index={index} />
    ),
    [onDayPress, theme]
  );

  const scrollToToday = useCallback(() => {
    flatListRef.current?.scrollToIndex({
      index: todayIndex,
      animated: true,
      viewPosition: 0.3,
    });
  }, [todayIndex]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      flatListRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
    },
    []
  );

  // Must use ref-based callback pairs — FlatList breaks if onViewableItemsChanged changes
  const viewabilityConfigCallbackPairs = useRef<ViewabilityConfigCallbackPairs>([
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 10 },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const visible = viewableItems.some(
          (item) => (item.item as DayCardData).date === todayDateRef.current
        );
        if (isTodayVisibleRef.current !== visible) {
          isTodayVisibleRef.current = visible;
          setIsTodayVisible(visible);
        }
      },
    },
  ]);

  const loadMorePast = useCallback(() => setPastCount((c) => c + 14), []);
  const loadMoreFuture = useCallback(() => setFutureCount((c) => c + 14), []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatListRef}
        data={days}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={Math.max(todayIndex - 1, 0)}
        getItemLayout={(_, index) => ({
          length: ESTIMATED_ITEM_HEIGHT,
          offset: ESTIMATED_ITEM_HEIGHT * index,
          index,
        })}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <LoadMoreButton label="∧ 加载更早" onPress={loadMorePast} theme={theme} />
        }
        ListFooterComponent={
          <LoadMoreButton label="∨ 加载更多" onPress={loadMoreFuture} theme={theme} />
        }
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          ) : undefined
        }
      />

      {/* Back to today FAB — spring entrance/exit animation */}
      {!isTodayVisible && (
        <Animated.View
          entering={ZoomIn.springify().stiffness(SPRING_FAB.stiffness).damping(SPRING_FAB.damping)}
          exiting={ZoomOut.duration(200)}
          style={styles.todayFab}
        >
          <Pressable
            onPress={scrollToToday}
            style={styles.todayFabInner}
          >
            <GlassView
              glassEffectStyle="regular"
              style={styles.todayFabGlass}
            />
            <Text style={[styles.todayFabText, { color: theme.accent }]}>
              回到今天
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  monthLabel: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  monthLabelText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  monthLabelRule: {
    height: StyleSheet.hairlineWidth,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  dateSection: {
    alignItems: "center",
  },
  weekdayLabel: {
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  dateNumber: {
    letterSpacing: -0.5,
    marginTop: 1,
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  todayPillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 4,
  },
  contentSection: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
    overflow: "hidden",
  },
  compactIconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  emptyText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  overflowText: {
    fontSize: 10,
    fontWeight: "600",
  },
  moreText: {
    fontSize: 9,
    fontWeight: "600",
  },
  todayFab: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    zIndex: 10,
  },
  todayFabInner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  todayFabGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  todayFabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 6,
    borderRadius: 10,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
