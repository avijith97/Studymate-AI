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

import ScreenHeader from "@/src/components/ScreenHeader";
import StudyInputBox, { StudyInput } from "@/src/components/StudyInputBox";
import BrutalButton from "@/src/components/BrutalButton";
import MarkdownText from "@/src/components/MarkdownText";
import BrutalCard from "@/src/components/BrutalCard";
import { colors } from "@/src/theme";
import { api } from "@/src/lib/api";
import { addHistory } from "@/src/lib/store";

export default function SummarizeScreen() {
  const [input, setInput] = useState<StudyInput>({ text: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);

  const onGenerate = async () => {
    if (!input.text.trim() && !input.image_base64 && !input.pdf_base64) {
      Alert.alert("Add content", "Paste text or attach an image/PDF to summarize.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.summarize({
        text: input.text.trim() || undefined,
        image_base64: input.image_base64,
        pdf_base64: input.pdf_base64,
      });
      setResult({ title: res.title || "Summary", content: res.content });
      await addHistory({
        id: res.id,
        type: "summarize",
        title: res.title || "Summary",
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
      <ScreenHeader title="Summarize" subtitle="Paste text, upload a PDF, or snap your notes." accent={colors.sun} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!result ? (
            <>
              <StudyInputBox
                value={input}
                onChange={setInput}
                placeholder="Paste the text you want summarized..."
                minLines={7}
              />
              <View style={{ height: 16 }} />
              <BrutalButton
                title={loading ? "Summarizing..." : "Summarize"}
                onPress={onGenerate}
                bg={colors.mint}
                disabled={loading}
                testID="summarize-submit"
              />
              {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
            </>
          ) : (
            <>
              <BrutalCard bg={colors.peach}>
                <Text style={styles.title}>Summary</Text>
                <MarkdownText source={result.content} />
              </BrutalCard>
              <View style={{ height: 14 }} />
              <BrutalButton
                title="Summarize another"
                onPress={() => {
                  setResult(null);
                  setInput({ text: "" });
                }}
                bg={colors.mint}
                testID="summarize-reset"
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
