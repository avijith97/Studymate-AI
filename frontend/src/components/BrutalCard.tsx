import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radii, shadow } from "@/src/theme";

export default function BrutalCard({
  children,
  bg = colors.surface,
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, shadow.hard, { backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 16,
  },
});
