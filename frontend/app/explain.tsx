import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import ScreenHeader from "@/src/components/ScreenHeader";
import StudyInputBox, { StudyInput } from "@/src/components/StudyInputBox";
import BrutalButton from "@/src/components/BrutalButton";
import MarkdownText from "@/src/components/MarkdownText";
import BrutalCard from "@/src/components/BrutalCard";
import { colors } from "@/src/theme";
import { api } from "@/src/lib/api";
import { addHistory } from "@/src/lib/store";

export default function ExplainScreen() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [input, setInput] = useState<StudyInput>({ text: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);

  const onGenerate = async () => {
    if (!topic.trim() && !input.text.trim() && !input.image_base64 && !input.pdf_base64) {
      Alert.alert("Add something", "Type a topic, paste text, or attach an image/PDF.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.explain({
        topic: topic.trim() || undefined,
        text: input.text.trim() || undefined,
        image_base64: input.image_base64,
        pdf_base64: input.pdf_base64,
      });
      setResult({ title: res.title, content: res.content });
      await addHistory({
        id: res.id,
        type: "explain",
        title: res.title,
        content: res.content,
        created_at: res.created_at,
      });
    } catch (e: any) {
      Alert.alert("AI couldn't respond", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Explain a Concept" subtitle="Topic or paste content — StudyMateAI breaks it down." accent={colors.lavender} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!result ? (
            <>
              <StudyInputBox
                value={input}
                onChange={setInput}
                showTopic
                topic={topic}
                onTopicChange={setTopic}
                placeholder="Or paste content you want explained..."
              />
              <View style={{ height: 16 }} />
              <BrutalButton
                title={loading ? "Thinking..." : "Explain it"}
                onPress={onGenerate}
                bg={colors.sun}
                disabled={loading}
                testID="explain-submit"
              />
              {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
            </>
          ) : (
            <>
              <BrutalCard bg={colors.mint}>
                <Text style={styles.title}>{result.title}</Text>
                <MarkdownText source={result.content} />
              </BrutalCard>
              <View style={{ height: 14 }} />
              <BrutalButton
                title="Explain another"
                onPress={() => {
                  setResult(null);
                  setTopic("");
                  setInput({ text: "" });
                }}
                bg={colors.sun}
                testID="explain-reset"
              />
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20 },
  title: {
    fontFamily: "Outfit_900Black",
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.4,
  },
});
