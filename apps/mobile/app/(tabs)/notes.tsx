import React, { useState, useMemo, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { Task } from "@aura/shared/types";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { NoteCard } from "../../components/NoteCard";
import { FAB } from "../../components/FAB";
import { CreateTaskSheet } from "../../components/CreateTaskSheet";
import { useTheme } from "../../lib/theme";
import { parseInput } from "../../lib/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function NotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tasks, loading, fetchTasks, createBatch, createNote } = useTasks(monthKey);
  const [showCreate, setShowCreate] = useState(false);

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
        ListHeaderComponent={
          notes.length > 0 ? (
            <View style={styles.countHeader}>
              <View style={{ flex: 1 }} />
              <Text style={[styles.countText, { color: theme.textSecondary }]}>
                {notes.length} 条笔记
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              🗒️
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
              {loading ? "加载中..." : "暂无笔记"}
            </Text>
            {!loading && (
              <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
                随时记录你的想法与灵感
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  row: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  countHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  listContent: {
    paddingTop: 12,
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
});
