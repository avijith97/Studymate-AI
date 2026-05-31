import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import BrutalButton from "@/src/components/BrutalButton";
import BrutalCard from "@/src/components/BrutalCard";
import { colors, radii, shadow } from "@/src/theme";
import { Exam, addExam, daysUntil, getExams, removeExam } from "@/src/lib/store";

const HOURGLASS =
  "https://static.prod-images.emergentagent.com/jobs/885da1fa-d1d8-4c4f-8b9d-630ac5be484d/images/d56ffe0a2769c84a80ef8d5a7de466ed78fbc5e13a75510ee199604f416cc411.png";

const PALETTE = [colors.peach, colors.lavender, colors.mint, colors.sun];

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayPlus(14));

  useFocusEffect(
    useCallback(() => {
      getExams().then(setExams);
    }, []),
  );

  const refresh = async () => setExams(await getExams());

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert("Add a name", "Please enter an exam name.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Invalid date", "Use the YYYY-MM-DD format.");
      return;
    }
    const exam: Exam = {
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      date,
      color: PALETTE[exams.length % PALETTE.length],
    };
    await addExam(exam);
    await refresh();
    setName("");
    setDate(todayPlus(14));
    setModalOpen(false);
  };

  const handleRemove = (e: Exam) =>
    Alert.alert("Remove exam?", e.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeExam(e.id);
          await refresh();
        },
      },
    ]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.peach }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>YOUR DEADLINES</Text>
            <Text style={styles.h1}>Exam Countdown</Text>
            <Text style={styles.sub}>Track every test in one place.</Text>
          </View>
          <Image source={{ uri: HOURGLASS }} style={styles.hourglass} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BrutalButton
          testID="open-add-exam"
          title="+ Add Exam"
          onPress={() => setModalOpen(true)}
          bg={colors.sun}
        />
        <View style={{ height: 20 }} />

        {exams.length === 0 ? (
          <BrutalCard bg={colors.lavender}>
            <Text style={styles.emptyTitle}>No exams yet</Text>
            <Text style={styles.emptyBody}>
              Add your upcoming exams to see countdowns and stay ahead of deadlines.
            </Text>
          </BrutalCard>
        ) : (
          exams.map((e, idx) => {
            const days = daysUntil(e.date);
            return (
              <View
                key={e.id}
                style={[
                  styles.examRow,
                  shadow.hard,
                  { backgroundColor: e.color ?? PALETTE[idx % PALETTE.length] },
                ]}
                testID={`exam-row-${idx}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.examName}>{e.name}</Text>
                  <Text style={styles.examDate}>{e.date}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.bigDays}>
                    {days < 0 ? "Past" : days}
                  </Text>
                  <Text style={styles.daysLabel}>
                    {days < 0 ? "" : days === 1 ? "DAY" : "DAYS"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(e)}
                  style={styles.removeBtn}
                  testID={`remove-exam-${idx}`}
                  activeOpacity={0.8}
                >
                  <Feather name="x" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, shadow.hard]}>
            <Text style={styles.modalTitle}>Add Exam</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              testID="exam-name-input"
              placeholder="e.g. Biology Midterm"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              testID="exam-date-input"
              placeholder="2026-06-15"
              placeholderTextColor="#888"
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <BrutalButton
                title="Cancel"
                onPress={() => setModalOpen(false)}
                bg="#fff"
                style={{ flex: 1 }}
                testID="cancel-add-exam"
              />
              <BrutalButton
                title="Save"
                onPress={handleAdd}
                bg={colors.mint}
                style={{ flex: 1 }}
                testID="save-exam"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: colors.peach,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  hourglass: { width: 90, height: 90 },
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
  scroll: { padding: 20 },
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
  examRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.xl,
    marginBottom: 14,
  },
  examName: { fontFamily: "Outfit_800ExtraBold", fontSize: 17, color: colors.textPrimary },
  examDate: {
    fontFamily: "Figtree_500Medium",
    fontSize: 12,
    color: colors.textPrimary,
    opacity: 0.7,
    marginTop: 2,
  },
  bigDays: {
    fontFamily: "Outfit_900Black",
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  daysLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.border,
    padding: 20,
  },
  modalTitle: {
    fontFamily: "Outfit_900Black",
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textPrimary,
    opacity: 0.7,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 15,
    fontFamily: "Figtree_500Medium",
    color: colors.textPrimary,
  },
});
