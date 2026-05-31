import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, radii, shadow } from "@/src/theme";

type Props = {
  title: string;
  onPress: () => void;
  bg?: string;
  textColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
};

export default function BrutalButton({
  title,
  onPress,
  bg = colors.sun,
  textColor = colors.textPrimary,
  disabled,
  style,
  textStyle,
  testID,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.btn,
        shadow.hard,
        { backgroundColor: disabled ? "#E5E5E5" : bg },
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
