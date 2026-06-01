import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import BrutalCard from "@/src/components/BrutalCard";
import { colors, radii, shadow } from "@/src/theme";
import { getHistory, removeHistory, HistoryItem } from "@/src/lib/store";

const TYPE_META: Record<HistoryItem["type"], { color: string; icon: any; label: string }> = {
  explain: { color: colors.lavender, icon: "zap", label: "Explanation" },
  summarize: { color: colors.sun, icon: "file-text", label: "Summary" },
  quiz: { color: colors.mint, icon: "help-circle", label: "Quiz" },
  flashcards: { color: colors.peach, icon: "layers", label: "Flashcards" },
};

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setItems);
    }, []),
  );

  const handleOpen = (item: HistoryItem) => {
    if (item.type === "explain" || item.type === "summarize") {
      router.push({
        pathname: "/result-text",
        params: {
          title: item.title,
          content: item.content ?? "",
          type: item.type,
        },
      });
    } else if (item.type === "quiz") {
      router.push({
        pathname: "/quiz",
        params: {
          replay: "1",
          payload: JSON.stringify({ title: item.title, questions: item.questions }),
        },
      });
    } else if (item.type === "flashcards") {
      router.push({
        pathname: "/flashcards",
        params: {
          replay: "1",
          payload: JSON.stringify({ title: item.title, cards: item.cards }),
        },
      });
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    await removeHistory(item.id);
    setItems(await getHistory());
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.lavender }}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR STUDIES</Text>
          <Text style={styles.h1}>History</Text>
          <Text style={styles.sub}>Pick up where you left off.</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <BrutalCard bg={colors.mint}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Your past explanations, summaries, quizzes, and flashcards will show up here.
            </Text>
          </BrutalCard>
        ) : (
          items.map((item, idx) => {
            const meta = TYPE_META[item.type];
            return (
              <View
                key={item.id}
                style={[styles.row, shadow.hard, { backgroundColor: meta.color }]}
                testID={`history-row-${idx}`}
              >
                <TouchableOpacity
                  onPress={() => handleOpen(item)}
                  onLongPress={() => handleDelete(item)}
                  activeOpacity={0.85}
                  style={styles.rowMain}
                  testID={`history-open-${idx}`}
                >
                  <View style={styles.rowIcon}>
                    <Feather name={meta.icon} size={20} color={colors.textPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tag}>{meta.label.toUpperCase()}</Text>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={styles.delBtn}
                  testID={`history-delete-${idx}`}
                  activeOpacity={0.7}
                  hitSlop={8}
                >
                  <Feather name="trash-2" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: colors.lavender,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  eyebrow: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  h1: {
    fontFamily: "Outfit_900Black",
    fontSize: 30,
    color: colors.textPrimary,
    marginTop: 4,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: "Figtree_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
    opacity: 0.7,
    marginTop: 4,
  },
  scroll: { padding: 20, gap: 12 },
  emptyTitle: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 18,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontFamily: "Figtree_500Medium",
    fontSize: 14,
    color: colors.textPrimary,
    opacity: 0.8,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.xl,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 2,
  },
  date: {
    fontFamily: "Figtree_500Medium",
    fontSize: 11,
    color: colors.textPrimary,
    opacity: 0.6,
    marginTop: 2,
  },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
