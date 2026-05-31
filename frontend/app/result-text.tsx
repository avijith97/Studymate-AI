import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

import ScreenHeader from "@/src/components/ScreenHeader";
import BrutalCard from "@/src/components/BrutalCard";
import MarkdownText from "@/src/components/MarkdownText";
import { colors } from "@/src/theme";

export default function ResultText() {
  const params = useLocalSearchParams<{ title?: string; content?: string; type?: string }>();
  const title = (params.title as string) ?? "Result";
  const content = (params.content as string) ?? "";
  const isSummary = params.type === "summarize";

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={isSummary ? "Summary" : "Explanation"}
        accent={isSummary ? colors.sun : colors.lavender}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrutalCard bg={isSummary ? colors.peach : colors.mint}>
          <Text style={styles.title}>{title}</Text>
          <MarkdownText source={content} />
        </BrutalCard>
        <View style={{ height: 40 }} />
      </ScrollView>
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
