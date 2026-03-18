import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions, Modal } from "react-native";
import dayjs from "dayjs";
import type { Task } from "@aura/shared/types";
import { TaskItem } from "./TaskItem";
import { TaskIcon } from "./TaskIcon";
import { useTheme } from "../lib/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NOTE_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

interface DayDetailSheetProps {
  date: string | null;
  tasks: Task[];
  onClose: () => void;
  onToggle: (id: string, status: string) => void;
  onPress: (task: Task) => void;
  onDelete: (id: string) => void;
}

function CompactNoteCard({
  note,
  onPress,
  theme,
}: {
  note: Task;
  onPress: (task: Task) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={() => onPress(note)}
      style={({ pressed }) => [
        styles.noteCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.borderSubtle,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          width: NOTE_CARD_WIDTH,
        },
      ]}
    >
      <TaskIcon icon={note.icon} color={note.icon_color} size={24} />
      <Text
        numberOfLines={2}
        style={[styles.noteTitle, { color: theme.text }]}
      >
        {note.title}
      </Text>
      {note.notes ? (
        <Text
          numberOfLines={2}
          style={[styles.notePreview, { color: theme.textSecondary }]}
        >
          {note.notes.replace(/[#*_~`]/g, "").slice(0, 80)}
        </Text>
      ) : null}
    </Pressable>
  );
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

  const dayTasks = useMemo(() => {
    if (!date) return [];
    return tasks.filter((t) => {
      if (!t.start_date || t.type === "note") return false;
      const start = t.start_date;
      const end = t.end_date || start;
      return date >= start && date <= end;
    });
  }, [date, tasks]);

  const dayNotes = useMemo(() => {
    if (!date) return [];
    return tasks.filter((t) => {
      if (t.type !== "note") return false;
      const noteDate = t.start_date || t.created_at?.slice(0, 10);
      return noteDate === date;
    });
  }, [date, tasks]);

  if (!date) return null;

  const d = dayjs(date);
  const weekday = d.format("dddd");
  const subtitle = `${weekday} · ${dayTasks.length}个任务 · ${dayNotes.length}条笔记`;
  const hasNoContent = dayTasks.length === 0 && dayNotes.length === 0;

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateTitle, { color: theme.text }]}>
                {d.format("M月D日")}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>
        </View>

        {hasNoContent ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              暂无内容
            </Text>
          </View>
        ) : (
          <FlatList
            data={[{ type: "content" as const }]}
            keyExtractor={() => "content"}
            renderItem={() => (
              <View>
                {/* Tasks */}
                {dayTasks.length > 0 && (
                  <View>
                    {dayTasks.map((t) => (
                      <TaskItem
                        key={t.id}
                        task={t}
                        onToggle={onToggle}
                        onPress={onPress}
                        onDelete={onDelete}
                      />
                    ))}
                  </View>
                )}

                {/* Divider between tasks and notes */}
                {dayTasks.length > 0 && dayNotes.length > 0 && (
                  <View
                    style={[
                      styles.sectionDivider,
                      { backgroundColor: theme.borderSubtle },
                    ]}
                  />
                )}

                {/* Notes grid */}
                {dayNotes.length > 0 && (
                  <View style={styles.notesSection}>
                    <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>
                      笔记
                    </Text>
                    <View style={styles.notesGrid}>
                      {dayNotes.map((n) => (
                        <CompactNoteCard
                          key={n.id}
                          note={n}
                          onPress={onPress}
                          theme={theme}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
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
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  notesSection: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 20,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  notePreview: {
    fontSize: 12,
    lineHeight: 16,
  },
});
