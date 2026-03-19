import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedKeyboard,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Easing,
} from "react-native-reanimated";
import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useTheme } from "../lib/theme";
import { useInputBar } from "../lib/input-bar-context";

type Mode = "task" | "note";

interface BottomInputBarProps {
  onCreateBatch: (text: string, parsed: object[]) => Promise<void>;
  onCreateNote: (text: string, noteData: object, tasks: object[]) => Promise<void>;
  parseInput: (text: string, mode?: "task" | "note") => Promise<unknown>;
}

const SPRING = { damping: 25, stiffness: 400 };

export function BottomInputBar({
  onCreateBatch,
  onCreateNote,
  parseInput,
}: BottomInputBarProps) {
  const theme = useTheme();
  const { isOpen, close } = useInputBar();
  const keyboard = useAnimatedKeyboard();
  const barAnimatedStyle = useAnimatedStyle(() => ({
    bottom: keyboard.height.value + 5,
  }));
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("task");
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const switchModeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-focus when opened; reset state when closed
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      Keyboard.dismiss();
      setText("");
      setMode("task");
      setExpanded(false);
    }
  }, [isOpen]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
      if (switchModeTimer.current) clearTimeout(switchModeTimer.current);
    };
  }, []);


  const sendScale = useSharedValue(0);
  const hasText = text.trim().length > 0;

  useEffect(() => {
    sendScale.value = withSpring(hasText ? 1 : 0, SPRING);
  }, [hasText]);

  const sendBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: sendScale.value,
  }));

  const modeLabelOpacity = useSharedValue(1);
  const switchMode = useCallback((newMode: Mode) => {
    if (switchModeTimer.current) clearTimeout(switchModeTimer.current);
    modeLabelOpacity.value = withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) });
    switchModeTimer.current = setTimeout(() => {
      setMode(newMode);
      setExpanded(newMode === "note");
      modeLabelOpacity.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
    }, 100);
  }, [modeLabelOpacity]);

  const modeLabelStyle = useAnimatedStyle(() => ({
    opacity: modeLabelOpacity.value,
  }));

  const showSuccess = useCallback((msg: string) => {
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessMsg(msg);
    successTimer.current = setTimeout(() => setSuccessMsg(null), 2000);
  }, []);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await parseInput(trimmed, mode);

      if (mode === "task") {
        const items = Array.isArray(result) ? result : [result];
        await onCreateBatch(trimmed, items);
        showSuccess(`已创建 ${items.length} 条任务`);
      } else {
        const noteResult = result as { note: object; tasks: object[] };
        await onCreateNote(trimmed, noteResult.note, noteResult.tasks || []);
        showSuccess("笔记已创建");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setText("");
      close();
    } catch (err) {
      console.error("[BottomInputBar] error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  };

  const placeholder = mode === "task"
    ? "描述任务，AI 帮你解析..."
    : "随手记录想法...";

  if (!isOpen && !successMsg) return null;

  return (
    <>
      {/* Success toast */}
      {successMsg && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.toast,
            { backgroundColor: theme.success },
          ]}
        >
          <SymbolView name="checkmark.circle.fill" tintColor="#fff" size={16} />
          <Text style={styles.toastText}>{successMsg}</Text>
        </Animated.View>
      )}

      {isOpen && (
        <>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            close();
          }}
        />
        <Animated.View style={[
          styles.wrapper,
          barAnimatedStyle,
          expanded && styles.wrapperExpanded,
        ]}>
            <GlassView
              glassEffectStyle="regular"
              style={[styles.glassBg, expanded && styles.glassBgExpanded]}
            />
            <View style={[styles.inner, expanded && styles.innerExpanded]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { color: theme.text },
                  expanded && styles.inputExpanded,
                ]}
                value={text}
                onChangeText={setText}
                placeholder={placeholder}
                placeholderTextColor={theme.textTertiary}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />

              <View style={styles.bottomRow}>
                <Pressable
                  onPress={() => switchMode(mode === "task" ? "note" : "task")}
                  style={styles.modeButton}
                  hitSlop={4}
                >
                  <SymbolView
                    name="sparkles"
                    tintColor={theme.accent}
                    size={14}
                  />
                  <Animated.Text
                    style={[styles.modeLabel, { color: theme.text }, modeLabelStyle]}
                  >
                    {mode === "task" ? "任务" : "笔记"}
                  </Animated.Text>
                  <SymbolView
                    name="arrow.left.arrow.right"
                    tintColor={theme.textSecondary}
                    size={10}
                  />
                </Pressable>

                <View style={styles.rightActions}>
                  {expanded && (
                    <Pressable
                      onPress={() => setExpanded(false)}
                      hitSlop={6}
                      style={styles.shrinkBtn}
                    >
                      <SymbolView
                        name="arrow.down.right.and.arrow.up.left"
                        tintColor={theme.textSecondary}
                        size={16}
                      />
                    </Pressable>
                  )}
                  <Animated.View style={[styles.sendBtnOuter, sendBtnStyle]}>
                    <Pressable
                      onPress={handleSend}
                      disabled={!hasText || sending}
                      style={[styles.sendBtn, { backgroundColor: theme.text }]}
                    >
                      {sending ? (
                        <ActivityIndicator size={16} color={theme.background} />
                      ) : (
                        <SymbolView
                          name="arrow.up"
                          tintColor={theme.background}
                          size={16}
                          weight="bold"
                        />
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </View>
        </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  wrapperExpanded: {
    top: 10,
    left: 10,
    right: 10,
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(120, 120, 128, 0.2)",
  },
  glassBgExpanded: {
    borderRadius: 20,
  },
  inner: {
    paddingHorizontal: 14,
    paddingTop: 24,
    paddingBottom: 22,
    gap: 8,
  },
  innerExpanded: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    fontWeight: "400",
    maxHeight: 100,
    minHeight: 44,
    paddingVertical: 0,
  },
  inputExpanded: {
    flex: 1,
    maxHeight: undefined,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shrinkBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  sendBtnOuter: {
    width: 32,
    height: 32,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
