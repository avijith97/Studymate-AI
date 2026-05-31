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
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";

import ScreenHeader from "@/src/components/ScreenHeader";
import StudyInputBox, { StudyInput } from "@/src/components/StudyInputBox";
import BrutalButton from "@/src/components/BrutalButton";
import BrutalCard from "@/src/components/BrutalCard";
import { colors, radii, shadow } from "@/src/theme";
import { api, QuizQuestion } from "@/src/lib/api";
import { addHistory } from "@/src/lib/store";

type Mode = "setup" | "loading" | "playing" | "done";

export default function QuizScreen() {
  const params = useLocalSearchParams<{ replay?: string; payload?: string }>();
  const [topic, setTopic] = useState("");
  const [input, setInput] = useState<StudyInput>({ text: "" });
  const [num, setNum] = useState(5);
  const [mode, setMode] = useState<Mode>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [title, setTitle] = useState<string>("");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (params.replay === "1" && params.payload) {
      try {
        const p = JSON.parse(params.payload as string);
        if (p?.questions?.length) {
          setQuestions(p.questions);
          setTitle(p.title ?? "Quiz");
          setMode("playing");
          setIdx(0);
          setAnswers([]);
          setPicked(null);
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
      const res = await api.quiz({
        topic: topic.trim() || undefined,
        text: input.text.trim() || undefined,
        image_base64: input.image_base64,
        pdf_base64: input.pdf_base64,
        num_questions: num,
      });
      setQuestions(res.questions);
      setTitle(res.title);
      setIdx(0);
      setPicked(null);
      setAnswers([]);
      setMode("playing");
      await addHistory({
        id: res.id,
        type: "quiz",
        title: res.title,
        questions: res.questions,
        created_at: res.created_at,
      });
    } catch (e: any) {
      Alert.alert("AI couldn't respond", e?.message ?? "Try again.");
      setMode("setup");
    }
  };

  const submitAnswer = () => {
    if (picked === null) return;
    setAnswers((prev) => [...prev, picked]);
  };

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      setMode("done");
    }
  };

  const restart = () => {
    setMode("setup");
    setQuestions([]);
    setAnswers([]);
    setPicked(null);
    setIdx(0);
    setTopic("");
    setInput({ text: "" });
  };

  const replay = () => {
    setIdx(0);
    setPicked(null);
    setAnswers([]);
    setMode("playing");
  };

  if (mode === "setup" || mode === "loading") {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Quiz Me" subtitle="Auto-generate MCQs from any topic or content." accent={colors.mint} />
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
              <Text style={styles.label}>HOW MANY QUESTIONS?</Text>
              <View style={styles.numRow}>
                {[3, 5, 7, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setNum(n)}
                    style={[
                      styles.numChip,
                      shadow.hard,
                      { backgroundColor: num === n ? colors.sun : "#fff" },
                    ]}
                    testID={`num-${n}`}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.numText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 16 }} />
            <BrutalButton
              title={mode === "loading" ? "Generating..." : "Generate Quiz"}
              onPress={generate}
              bg={colors.peach}
              disabled={mode === "loading"}
              testID="quiz-generate"
            />
            {mode === "loading" && <ActivityIndicator style={{ marginTop: 16 }} />}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (mode === "done") {
    const correct = answers.filter((a, i) => a === questions[i].correct_index).length;
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <View style={styles.root}>
        <ScreenHeader title="Quiz Results" accent={colors.mint} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <BrutalCard bg={colors.sun}>
            <Text style={styles.scoreLabel}>YOUR SCORE</Text>
            <Text style={styles.scoreBig}>
              {correct}/{questions.length}
            </Text>
            <Text style={styles.scorePct}>{pct}%</Text>
          </BrutalCard>
          <View style={{ height: 16 }} />
          {questions.map((q, i) => {
            const ok = answers[i] === q.correct_index;
            return (
              <BrutalCard
                key={i}
                bg={ok ? colors.green : colors.red}
                style={{ marginBottom: 12 }}
              >
                <Text style={styles.qNum}>Q{i + 1}</Text>
                <Text style={styles.qText}>{q.question}</Text>
                <Text style={styles.aLine}>
                  <Text style={styles.aLineLabel}>Your answer: </Text>
                  {q.options[answers[i]] ?? "—"}
                </Text>
                <Text style={styles.aLine}>
                  <Text style={styles.aLineLabel}>Correct: </Text>
                  {q.options[q.correct_index]}
                </Text>
                <Text style={styles.expl}>{q.explanation}</Text>
              </BrutalCard>
            );
          })}
          <BrutalButton title="Retry quiz" onPress={replay} bg={colors.lavender} testID="quiz-retry" />
          <View style={{ height: 10 }} />
          <BrutalButton title="New quiz" onPress={restart} bg={colors.peach} testID="quiz-new" />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // Playing
  const q = questions[idx];
  const answered = answers.length > idx;
  return (
    <View style={styles.root}>
      <ScreenHeader title={title || "Quiz"} subtitle={`Question ${idx + 1} of ${questions.length}`} accent={colors.mint} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrutalCard bg="#fff">
          <Text style={styles.qNum}>Q{idx + 1}</Text>
          <Text style={styles.qText}>{q.question}</Text>
        </BrutalCard>
        <View style={{ height: 14 }} />
        {q.options.map((opt, i) => {
          let bg = "#fff";
          if (answered) {
            if (i === q.correct_index) bg = colors.green;
            else if (i === answers[idx]) bg = colors.red;
          } else if (picked === i) {
            bg = colors.sun;
          }
          return (
            <TouchableOpacity
              key={i}
              onPress={() => !answered && setPicked(i)}
              activeOpacity={0.85}
              style={[styles.option, shadow.hard, { backgroundColor: bg }]}
              testID={`quiz-option-${i}`}
              disabled={answered}
            >
              <View style={styles.optionLetter}>
                <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {answered && i === q.correct_index && (
                <Feather name="check" size={20} color={colors.textPrimary} />
              )}
            </TouchableOpacity>
          );
        })}

        {answered && (
          <BrutalCard bg={colors.lavender} style={{ marginTop: 14 }}>
            <Text style={styles.explLabel}>WHY?</Text>
            <Text style={styles.expl}>{q.explanation}</Text>
          </BrutalCard>
        )}

        <View style={{ height: 14 }} />
        {answered ? (
          <BrutalButton
            title={idx + 1 < questions.length ? "Next question" : "See results"}
            onPress={next}
            bg={colors.sun}
            testID="quiz-next"
          />
        ) : (
          <BrutalButton
            title="Submit answer"
            onPress={submitAnswer}
            bg={colors.peach}
            disabled={picked === null}
            testID="quiz-submit-answer"
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  qNum: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textPrimary,
    opacity: 0.6,
  },
  qText: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: 6,
    lineHeight: 28,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterText: {
    fontFamily: "Outfit_900Black",
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionText: {
    flex: 1,
    fontFamily: "Figtree_600SemiBold",
    fontSize: 15,
    color: colors.textPrimary,
  },
  explLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  expl: {
    fontFamily: "Figtree_500Medium",
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
    marginTop: 4,
  },
  aLine: {
    fontFamily: "Figtree_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 6,
  },
  aLineLabel: { fontFamily: "Outfit_800ExtraBold" },
  scoreLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  scoreBig: {
    fontFamily: "Outfit_900Black",
    fontSize: 56,
    color: colors.textPrimary,
    letterSpacing: -2,
    marginTop: 4,
  },
  scorePct: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 18,
    color: colors.textPrimary,
  },
});
