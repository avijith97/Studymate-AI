import React from "react";
import { Text, TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, shadow } from "@/src/theme";

type Props = {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  bg: string;
  style?: ViewStyle;
  subtitle?: string;
  testID?: string;
};

export default function ActionTile({ title, icon, onPress, bg, style, subtitle, testID }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      testID={testID}
      style={[styles.tile, shadow.hard, { backgroundColor: bg }, style]}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={28} color={colors.textPrimary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 16,
    minHeight: 130,
    justifyContent: "space-between",
  },
  iconWrap: {
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
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "Figtree_500Medium",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
