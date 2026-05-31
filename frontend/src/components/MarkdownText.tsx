import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "@/src/theme";

// Lightweight markdown-ish renderer for AI text.
// Handles: ## H2, ### H3, **bold**, * bullets, --- dividers, code-ish (skip).
export default function MarkdownText({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      blocks.push(<View key={`sp-${idx}`} style={{ height: 8 }} />);
      return;
    }
    if (/^---+$/.test(line)) {
      blocks.push(<View key={`hr-${idx}`} style={styles.hr} />);
      return;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <Text key={idx} style={styles.h3}>
          {line.slice(4)}
        </Text>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <Text key={idx} style={styles.h2}>
          {line.slice(3)}
        </Text>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <Text key={idx} style={styles.h1}>
          {line.slice(2)}
        </Text>,
      );
      return;
    }
    if (/^(\*|-|\d+\.)\s+/.test(line)) {
      const m = line.match(/^(\*|-|\d+\.)\s+(.*)/);
      const isOrdered = m && /\d+\./.test(m[1]);
      const bullet = isOrdered ? m![1] : "•";
      blocks.push(
        <View key={idx} style={styles.bulletRow}>
          <Text style={styles.bullet}>{bullet}</Text>
          <Text style={styles.bulletText}>{renderInline(m ? m[2] : line)}</Text>
        </View>,
      );
      return;
    }
    blocks.push(
      <Text key={idx} style={styles.p}>
        {renderInline(line)}
      </Text>,
    );
  });

  return <View>{blocks}</View>;
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return (
        <Text key={i} style={{ fontFamily: "Outfit_800ExtraBold", backgroundColor: "#FFE885" }}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{p}</Text>;
  });
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: "Outfit_900Black",
    fontSize: 24,
    color: colors.textPrimary,
    marginVertical: 8,
  },
  h2: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  p: {
    fontFamily: "Figtree_500Medium",
    fontSize: 15,
    lineHeight: 23,
    color: colors.textPrimary,
    marginVertical: 3,
  },
  bulletRow: { flexDirection: "row", gap: 8, marginVertical: 3, paddingRight: 8 },
  bullet: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 15,
    color: colors.textPrimary,
    minWidth: 18,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Figtree_500Medium",
    fontSize: 15,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  hr: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
});
