import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import ActionTile from "@/src/components/ActionTile";
import BrutalCard from "@/src/components/BrutalCard";
import { colors, radii, shadow } from "@/src/theme";
import { Exam, daysUntil, getExams } from "@/src/lib/store";

const MASCOT =
  "https://static.prod-images.emergentagent.com/jobs/885da1fa-d1d8-4c4f-8b9d-630ac5be484d/images/96fb81e04ebf26e6a02962745d74ef2408720e05aad71071982746674a3b8b63.png";
const HOURGLASS =
  "https://static.prod-images.emergentagent.com/jobs/885da1fa-d1d8-4c4f-8b9d-630ac5be484d/images/d56ffe0a2769c84a80ef8d5a7de466ed78fbc5e13a75510ee199604f416cc411.png";

const examColors = [colors.peach, colors.lavender, colors.mint, colors.sun];

export default function Home() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);

  useFocusEffect(
    useCallback(() => {
      getExams().then(setExams);
    }, []),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.mint }}>
        <View style={styles.heroWrap}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>STUDYMATE AI</Text>
            <Text style={styles.h1}>Hey, Scholar.{"\n"}Let{"'"}s crush it.</Text>
            <Text style={styles.sub}>
              No login. No fuss. Tap below to start studying instantly.
            </Text>
          </View>
          <Image source={{ uri: MASCOT }} style={styles.mascot} resizeMode="contain" />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Exam countdown */}
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>Exam Countdown</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/exams")}
            testID="add-exam-link"
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLink}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {exams.length === 0 ? (
          <BrutalCard bg={colors.lavender} style={{ marginTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Image source={{ uri: HOURGLASS }} style={styles.hourglassSm} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>No exams yet</Text>
                <Text style={styles.cardBody}>
                  Add your next exam to see the countdown right here.
                </Text>
              </View>
            </View>
          </BrutalCard>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            {exams.slice(0, 6).map((e, idx) => {
              const days = daysUntil(e.date);
              return (
                <View
                  key={e.id}
                  style={[
                    styles.examCard,
                    shadow.hard,
                    { backgroundColor: e.color ?? examColors[idx % examColors.length] },
                  ]}
                  testID={`exam-card-${idx}`}
                >
                  <Image source={{ uri: HOURGLASS }} style={styles.hourglass} />
                  <Text style={styles.examDays}>
                    {days < 0 ? "Past" : days}
                  </Text>
                  <Text style={styles.examDaysLabel}>
                    {days < 0 ? "" : days === 1 ? "DAY LEFT" : "DAYS LEFT"}
                  </Text>
                  <Text style={styles.examName} numberOfLines={2}>
                    {e.name}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quick Actions</Text>
        <View style={styles.grid}>
          <ActionTile
            testID="action-explain"
            title="Explain"
            subtitle="any concept"
            icon="zap"
            bg={colors.lavender}
            onPress={() => router.push("/explain")}
          />
          <ActionTile
            testID="action-summarize"
            title="Summarize"
            subtitle="long content"
            icon="file-text"
            bg={colors.sun}
            onPress={() => router.push("/summarize")}
          />
        </View>
        <View style={[styles.grid, { marginTop: 12 }]}>
          <ActionTile
            testID="action-quiz"
            title="Quiz Me"
            subtitle="auto MCQs"
            icon="help-circle"
            bg={colors.mint}
            onPress={() => router.push("/quiz")}
          />
          <ActionTile
            testID="action-flashcards"
            title="Flashcards"
            subtitle="learn fast"
            icon="layers"
            bg={colors.peach}
            onPress={() => router.push("/flashcards")}
          />
        </View>

        <BrutalCard bg="#fff" style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <View style={styles.iconCircle}>
              <Feather name="info" size={18} color={colors.textPrimary} />
            </View>
            <Text style={[styles.cardBody, { flex: 1 }]}>
              Tip: upload a PDF or snap a photo of your notes. StudyMateAI understands images and documents too.
            </Text>
          </View>
        </BrutalCard>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: colors.mint,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  mascot: { width: 110, height: 110 },
  eyebrow: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  h1: {
    fontFamily: "Outfit_900Black",
    fontSize: 32,
    color: colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -1,
    marginTop: 6,
  },
  sub: {
    fontFamily: "Figtree_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 8,
    opacity: 0.7,
  },
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontFamily: "Outfit_900Black",
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLink: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.sun,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  examCard: {
    width: 170,
    minHeight: 170,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 14,
    justifyContent: "space-between",
  },
  hourglass: { width: 48, height: 48, alignSelf: "flex-end" },
  hourglassSm: { width: 56, height: 56 },
  examDays: {
    fontFamily: "Outfit_900Black",
    fontSize: 48,
    lineHeight: 50,
    color: colors.textPrimary,
    letterSpacing: -2,
    marginTop: 4,
  },
  examDaysLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  examName: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 6,
  },
  grid: { flexDirection: "row", gap: 12 },
  cardTitle: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 17,
    color: colors.textPrimary,
  },
  cardBody: {
    fontFamily: "Figtree_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 18,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.sun,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
