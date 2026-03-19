import React, { useMemo, useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { useCalendar } from "../../hooks/useCalendar";
import { useTasks } from "../../hooks/useTasks";
import { NoteCard } from "../../components/NoteCard";
import { BottomInputBar } from "../../components/BottomInputBar";
import { useTheme } from "../../lib/theme";
import { useTabBarHeight } from "../../lib/tab-bar-height";
import { parseInput } from "../../lib/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const INITIAL_COUNT = 20;
const PAGE_SIZE = 20;

export default function NotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { monthKey } = useCalendar();
  const { tabBarHeight } = useTabBarHeight();
  const { tasks, loading, fetchTasks, createBatch, createNote } = useTasks(monthKey);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const allNotes = useMemo(
    () => tasks.filter((t) => t.type === "note").reverse(),
    [tasks]
  );

  const notes = useMemo(
    () => allNotes.slice(0, visibleCount),
    [allNotes, visibleCount]
  );

  const remainingCount = allNotes.length - notes.length;

  const loadMore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  const handleNotePress = useCallback(
    (note: Task) => {
      router.push(`/note/${note.id}` as `/note/${string}`);
    },
    [router]
  );

  const BOTTOM_INSET = tabBarHeight + 16;

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
          allNotes.length > 0 ? (
            <View style={styles.countHeader}>
              <View style={{ flex: 1 }} />
              <Text style={[styles.countText, { color: theme.textSecondary }]}>
                {allNotes.length} 条笔记
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          remainingCount > 0 ? (
            <View style={styles.footerContainer}>
              <Pressable
                onPress={loadMore}
                style={[styles.footerButton, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
              >
                <SymbolView name="chevron.down" size={10} tintColor={theme.accent} />
                <Text style={[styles.footerText, { color: theme.accent }]}>
                  加载更多 ({remainingCount})
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <SymbolView name="square.and.pencil" size={40} tintColor={theme.textTertiary} />
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
        contentContainerStyle={{ paddingTop: 12, paddingBottom: BOTTOM_INSET }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchTasks}
            tintColor={theme.accent}
          />
        }
      />

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
  footerContainer: {
    alignItems: "center",
    paddingVertical: 12,
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
  empty: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 2,
  },
});
