import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import dayjs from "dayjs";
import type { Task } from "@aura/shared/types";
import { resolveEmoji } from "@aura/shared/icons";
import { useTheme } from "../lib/theme";

const WEEK_DAYS = ["一", "二", "三", "四", "五", "六", "日"];
const SCREEN_WIDTH = Dimensions.get("window").width;
const CELL_SIZE = (SCREEN_WIDTH - 32) / 7;

interface CalendarGridProps {
  year: number;
  month: number;
  tasks: Task[];
  onDayPress: (date: string) => void;
}

function getMonthDays(year: number, month: number) {
  const first = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const startOfWeek = (first.day() + 6) % 7;
  const daysInMonth = first.daysInMonth();
  const days: dayjs.Dayjs[] = [];

  for (let i = startOfWeek - 1; i >= 0; i--) {
    days.push(first.subtract(i + 1, "day"));
  }
  for (let i = 0; i < daysInMonth; i++) {
    days.push(first.add(i, "day"));
  }
  while (days.length < 42) {
    days.push(first.add(daysInMonth + days.length - daysInMonth - startOfWeek, "day"));
  }
  while (days.length > 35 && days.length % 7 === 0) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((d) => d.month() !== month - 1)) {
      days.splice(-7);
    } else break;
  }
  return days;
}

export function CalendarGrid({ year, month, tasks, onDayPress }: CalendarGridProps) {
  const theme = useTheme();
  const today = dayjs().format("YYYY-MM-DD");

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.start_date || t.type === "note") continue;
      const start = t.start_date;
      const end = t.end_date || start;
      let d = dayjs(start);
      const last = dayjs(end);
      while (d.isBefore(last) || d.isSame(last, "day")) {
        const key = d.format("YYYY-MM-DD");
        if (!map[key]) map[key] = [];
        map[key].push(t);
        d = d.add(1, "day");
      }
    }
    return map;
  }, [tasks]);

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Text style={[styles.weekDay, { color: theme.textSecondary }]}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const dateStr = day.format("YYYY-MM-DD");
          const isCurrentMonth = day.month() === month - 1;
          const isToday = dateStr === today;
          const dayTasks = tasksByDay[dateStr] || [];

          return (
            <Pressable
              key={dateStr}
              onPress={() => onDayPress(dateStr)}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayNumber,
                  isToday && { backgroundColor: theme.accent },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isToday
                        ? "#fff"
                        : isCurrentMonth
                          ? theme.text
                          : theme.textTertiary,
                    },
                  ]}
                >
                  {day.date()}
                </Text>
              </View>

              <View style={styles.taskDots}>
                {dayTasks.slice(0, 3).map((t, i) => (
                  <Text key={t.id} style={styles.taskDot}>
                    {resolveEmoji(t.icon)}
                  </Text>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekCell: {
    width: CELL_SIZE,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDay: {
    fontSize: 13,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    paddingTop: 2,
  },
  dayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
  },
  taskDots: {
    flexDirection: "row",
    gap: 1,
    marginTop: 2,
  },
  taskDot: {
    fontSize: 8,
  },
});
