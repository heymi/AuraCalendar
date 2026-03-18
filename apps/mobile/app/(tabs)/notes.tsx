import React, { useMemo, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { Task } from "@aura/shared/types";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { NoteCard } from "../../components/NoteCard";
import { ChatInput } from "../../components/ChatInput";
import { useTheme } from "../../lib/theme";
import { parseInput, createTask } from "../../lib/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function NotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tasks, loading, createNote, fetchTasks } = useTasks(monthKey);

  const notes = useMemo(
    () => tasks.filter((t) => t.type === "note").reverse(),
    [tasks]
  );

  const handleNotePress = useCallback(
    (note: Task) => {
      router.push(`/note/${note.id}` as `/note/${string}`);
    },
    [router]
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      const result = await parseInput(text, "note");
      const data = result as { note: object; tasks: object[] };
      if (data.note) {
        await createNote(text, data.note, data.tasks || []);
      }
    },
    [createNote]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["left", "right"]}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <View style={{ width: CARD_WIDTH }}>
            <NoteCard note={item} onPress={handleNotePress} index={index} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              {loading ? "加载中..." : "暂无笔记"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <ChatInput
        onSubmit={handleSubmit}
        placeholder="随手记录..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
});
