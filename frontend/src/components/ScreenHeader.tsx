import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/theme";

export default function ScreenHeader({
  title,
  subtitle,
  accent = colors.mint,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  const router = useRouter();
  return (
    <View style={[styles.wrap, { backgroundColor: accent }]}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            testID="back-button"
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Outfit_900Black",
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Figtree_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
    opacity: 0.7,
    marginTop: 2,
  },
});
