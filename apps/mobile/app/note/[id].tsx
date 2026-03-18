import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Markdown from "react-native-markdown-display";
import type { Task } from "@aura/shared/types";
import { fetchTasks, updateTask, deleteTask } from "../../lib/api";
import { TaskIcon } from "../../components/TaskIcon";
import { useTheme } from "../../lib/theme";
import dayjs from "dayjs";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { stiffness: 400, damping: 28 };

export default function NoteDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  const editBtnScale = useSharedValue(1);
  const deleteBtnScale = useSharedValue(1);
  const saveBtnScale = useSharedValue(1);
  const cancelBtnScale = useSharedValue(1);

  useEffect(() => {
    const month = dayjs().format("YYYY-MM");
    fetchTasks(month).then((tasks) => {
      const found = tasks.find((t) => t.id === id);
      if (found) {
        setNote(found);
        setEditTitle(found.title);
        setEditContent(found.notes || "");
      }
    });
  }, [id]);

  const handleSave = async () => {
    if (!note || saving) return;
    setSaving(true);
    try {
      await updateTask(note.id, {
        title: editTitle,
        notes: editContent,
      });
      setNote({ ...note, title: editTitle, notes: editContent });
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("保存失败", "请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!note) return;
    Alert.alert("删除笔记", `确定删除「${note.title}」？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteTask(note.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  const editBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editBtnScale.value }],
  }));
  const deleteBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteBtnScale.value }],
  }));
  const saveBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveBtnScale.value }],
  }));
  const cancelBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelBtnScale.value }],
  }));

  const markdownStyles = {
    body: { color: theme.text, fontSize: 15, lineHeight: 26 },
    heading1: { color: theme.text, fontSize: 22, fontWeight: "700" as const, marginBottom: 8 },
    heading2: { color: theme.text, fontSize: 19, fontWeight: "600" as const, marginBottom: 6 },
    heading3: { color: theme.text, fontSize: 17, fontWeight: "600" as const, marginBottom: 4 },
    paragraph: { marginVertical: 4 },
    code_inline: {
      backgroundColor: theme.background,
      color: theme.accent,
      fontSize: 14,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    fence: {
      backgroundColor: theme.background,
      color: theme.text,
      fontSize: 13,
      padding: 12,
      borderRadius: 10,
      borderColor: theme.borderSubtle,
      borderWidth: 1,
    },
    link: { color: theme.accent },
    list_item: { color: theme.text, fontSize: 15, lineHeight: 26 },
    blockquote: {
      backgroundColor: theme.background,
      borderLeftColor: theme.accent,
      borderLeftWidth: 3,
      paddingLeft: 12,
      paddingVertical: 4,
      marginVertical: 8,
    },
  };

  if (!note) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {editing ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={styles.editContainer}
        >
          <TextInput
            style={[
              styles.editTitle,
              {
                color: theme.text,
                borderColor: titleFocused ? theme.accent : theme.border,
              },
            ]}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="标题"
            placeholderTextColor={theme.textTertiary}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
          />
          <TextInput
            style={[
              styles.editContent,
              {
                color: theme.text,
                borderColor: contentFocused ? theme.accent : theme.border,
              },
            ]}
            value={editContent}
            onChangeText={setEditContent}
            placeholder="内容（支持 Markdown）"
            placeholderTextColor={theme.textTertiary}
            multiline
            textAlignVertical="top"
            autoFocus
            onFocus={() => setContentFocused(true)}
            onBlur={() => setContentFocused(false)}
          />
          <View style={styles.editActions}>
            <AnimatedPressable
              onPress={() => {
                setEditTitle(note.title);
                setEditContent(note.notes || "");
                setEditing(false);
              }}
              onPressIn={() => {
                cancelBtnScale.value = withSpring(0.95, SPRING_CONFIG);
              }}
              onPressOut={() => {
                cancelBtnScale.value = withSpring(1, SPRING_CONFIG);
              }}
              style={[
                styles.cancelBtn,
                { borderColor: theme.border },
                cancelBtnAnimStyle,
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>取消</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={handleSave}
              disabled={saving}
              onPressIn={() => {
                saveBtnScale.value = withSpring(0.95, SPRING_CONFIG);
              }}
              onPressOut={() => {
                saveBtnScale.value = withSpring(1, SPRING_CONFIG);
              }}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: theme.accent,
                  opacity: saving ? 0.6 : 1,
                },
                saveBtnAnimStyle,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>保存</Text>
              )}
            </AnimatedPressable>
          </View>
        </Animated.View>
      ) : (
        <>
          {/* Staggered entrance: icon, title, date */}
          <View style={styles.header}>
            <Animated.View
              entering={FadeInDown.delay(0).duration(300).springify().damping(28).stiffness(350)}
            >
              <TaskIcon icon={note.icon} color={note.icon_color} size={48} />
            </Animated.View>
            <Animated.Text
              entering={FadeInDown.delay(100).duration(300).springify().damping(28).stiffness(350)}
              style={[styles.title, { color: theme.text }]}
            >
              {note.title}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(300).springify().damping(28).stiffness(350)}
              style={[styles.date, { color: theme.textSecondary }]}
            >
              {dayjs(note.created_at).format("YYYY年M月D日 HH:mm")}
            </Animated.Text>
          </View>

          {/* Body with staggered entrance */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(300).springify().damping(28).stiffness(350)}
            style={[styles.noteBody, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
          >
            {note.notes ? (
              <Markdown style={markdownStyles}>{note.notes}</Markdown>
            ) : (
              <Text style={{ color: theme.textTertiary, fontSize: 15 }}>
                暂无内容
              </Text>
            )}
          </Animated.View>

          {/* Action buttons with spring scale */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(300).springify().damping(28).stiffness(350)}
            style={styles.actionRow}
          >
            <AnimatedPressable
              onPress={() => setEditing(true)}
              onPressIn={() => {
                editBtnScale.value = withSpring(0.95, SPRING_CONFIG);
              }}
              onPressOut={() => {
                editBtnScale.value = withSpring(1, SPRING_CONFIG);
              }}
              style={[
                styles.editBtn,
                { borderColor: theme.border },
                editBtnAnimStyle,
              ]}
            >
              <Text style={[styles.editBtnText, { color: theme.accent }]}>编辑</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={handleDelete}
              onPressIn={() => {
                deleteBtnScale.value = withSpring(0.95, SPRING_CONFIG);
              }}
              onPressOut={() => {
                deleteBtnScale.value = withSpring(1, SPRING_CONFIG);
              }}
              style={deleteBtnAnimStyle}
            >
              <Text style={[styles.deleteBtnText, { color: theme.danger }]}>删除</Text>
            </AnimatedPressable>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  date: {
    fontSize: 14,
  },
  noteBody: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "500",
  },
  editContainer: {
    gap: 20,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  editContent: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 300,
    lineHeight: 24,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
