import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import ScreenHeader from "@/src/components/ScreenHeader";
import StudyInputBox, { StudyInput } from "@/src/components/StudyInputBox";
import BrutalButton from "@/src/components/BrutalButton";
import { colors, radii, shadow } from "@/src/theme";
import { api, Flashcard } from "@/src/lib/api";
import { addHistory } from "@/src/lib/store";

type Mode = "setup" | "loading" | "study";

const COLORS_CYCLE = [colors.peach, colors.lavender, colors.mint, colors.sun];

export default function FlashcardsScreen() {
  const params = useLocalSearchParams<{ replay?: string; payload?: string }>();
  const [topic, setTopic] = useState("");
  const [input, setInput] = useState<StudyInput>({ text: "" });
  const [num, setNum] = useState(8);
  const [mode, setMode] = useState<Mode>("setup");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const flip = useSharedValue(0);

  useEffect(() => {
    if (params.replay === "1" && params.payload) {
      try {
        const p = JSON.parse(params.payload as string);
        if (p?.cards?.length) {
          setCards(p.cards);
          setMode("study");
          setIdx(0);
          flip.value = 0;
        }
      } catch {}
    }
  }, [params.replay, params.payload]);

  const generate = async () => {
    if (!topic.trim() && !input.text.trim() && !input.image_base64 && !input.pdf_base64) {
      Alert.alert("Add something", "Type a topic, paste text, or attach an image/PDF.");
      return;
    }
    setMode("loading");
    try {
      const res = await api.flashcards({
        topic: topic.trim() || undefined,
        text: input.text.trim() || undefined,
        image_base64: input.image_base64,
        pdf_base64: input.pdf_base64,
        num_cards: num,
      });
      setCards(res.cards);
      setIdx(0);
      flip.value = 0;
      setMode("study");
      await addHistory({
        id: res.id,
        type: "flashcards",
        title: res.title,
        cards: res.cards,
        created_at: res.created_at,
      });
    } catch (e: any) {
      Alert.alert("AI couldn't respond", e?.message ?? "Try again.");
      setMode("setup");
    }
  };

  const toggleFlip = () => {
    flip.value = withTiming(flip.value === 0 ? 1 : 0, { duration: 380 });
  };

  const goPrev = () => {
    if (idx > 0) {
      flip.value = 0;
      setIdx(idx - 1);
    }
  };

  const goNext = () => {
    if (idx < cards.length - 1) {
      flip.value = 0;
      setIdx(idx + 1);
    }
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(flip.value, [0, 1], [0, 180])}deg`;
    const opacity = flip.value < 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1000 }, { rotateY }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(flip.value, [0, 1], [180, 360])}deg`;
    const opacity = flip.value >= 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1000 }, { rotateY }],
      opacity,
    };
  });

  if (mode === "setup" || mode === "loading") {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Flashcards" subtitle="Atomic cards. Tap to flip. Swipe through." accent={colors.peach} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <StudyInputBox
              value={input}
              onChange={setInput}
              showTopic
              topic={topic}
              onTopicChange={setTopic}
              placeholder="Optional source text..."
            />
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>HOW MANY CARDS?</Text>
              <View style={styles.numRow}>
                {[5, 8, 10, 15].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setNum(n)}
                    style={[
                      styles.numChip,
                      shadow.hard,
                      { backgroundColor: num === n ? colors.sun : "#fff" },
                    ]}
                    testID={`num-cards-${n}`}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.numText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 16 }} />
            <BrutalButton
              title={mode === "loading" ? "Cooking cards..." : "Generate Flashcards"}
              onPress={generate}
              bg={colors.mint}
              disabled={mode === "loading"}
              testID="flashcards-generate"
            />
            {mode === "loading" && <ActivityIndicator style={{ marginTop: 16 }} />}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  const card = cards[idx];
  const bg = COLORS_CYCLE[idx % COLORS_CYCLE.length];

  return (
    <View style={styles.root}>
      <ScreenHeader title="Flashcards" subtitle={`Card ${idx + 1} of ${cards.length}`} accent={colors.peach} />
      <View style={styles.studyArea}>
        <Pressable onPress={toggleFlip} style={styles.cardWrap} testID="flashcard-tap">
          <Animated.View
            style={[styles.card, shadow.hardLg, { backgroundColor: bg }, frontStyle]}
            pointerEvents={flip.value < 0.5 ? "auto" : "none"}
          >
            <Text style={styles.faceLabel}>FRONT</Text>
            <Text style={styles.faceText}>{card.front}</Text>
            <Text style={styles.tapHint}>Tap to flip</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              shadow.hardLg,
              { backgroundColor: "#fff" },
              backStyle,
            ]}
            pointerEvents={flip.value >= 0.5 ? "auto" : "none"}
          >
            <Text style={styles.faceLabel}>BACK</Text>
            <Text style={styles.faceTextBack}>{card.back}</Text>
            <Text style={styles.tapHint}>Tap to flip</Text>
          </Animated.View>
        </Pressable>

        <View style={styles.nav}>
          <TouchableOpacity
            onPress={goPrev}
            style={[styles.navBtn, shadow.hard, idx === 0 && { opacity: 0.4 }]}
            testID="flashcard-prev"
            disabled={idx === 0}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressWrap}>
            <View
              style={[
                styles.progressBar,
                { width: `${((idx + 1) / cards.length) * 100}%` },
              ]}
            />
          </View>
          <TouchableOpacity
            onPress={goNext}
            style={[styles.navBtn, shadow.hard, idx === cards.length - 1 && { opacity: 0.4 }]}
            testID="flashcard-next"
            disabled={idx === cards.length - 1}
            activeOpacity={0.8}
          >
            <Feather name="chevron-right" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 12 }} />
        <BrutalButton
          title="New deck"
          onPress={() => {
            setMode("setup");
            setCards([]);
            setIdx(0);
            setTopic("");
            setInput({ text: "" });
          }}
          bg={colors.lavender}
          testID="flashcards-reset"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20 },
  label: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textPrimary,
    opacity: 0.7,
    marginBottom: 8,
  },
  numRow: { flexDirection: "row", gap: 10 },
  numChip: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  numText: { fontFamily: "Outfit_900Black", fontSize: 18, color: colors.textPrimary },
  studyArea: { flex: 1, padding: 20, paddingTop: 30 },
  cardWrap: {
    flex: 1,
    maxHeight: 440,
    minHeight: 320,
  },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 28,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
  },
  cardBack: {},
  faceLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.textPrimary,
    opacity: 0.6,
    position: "absolute",
    top: 18,
    left: 22,
  },
  faceText: {
    fontFamily: "Outfit_900Black",
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.6,
  },
  faceTextBack: {
    fontFamily: "Figtree_600SemiBold",
    fontSize: 17,
    lineHeight: 25,
    color: colors.textPrimary,
    textAlign: "center",
  },
  tapHint: {
    position: "absolute",
    bottom: 18,
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textPrimary,
    opacity: 0.5,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: {
    flex: 1,
    height: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.sun,
  },
});
