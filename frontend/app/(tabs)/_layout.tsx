import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, shadow } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: "#9A9A9A",
        tabBarLabelStyle: {
          fontFamily: "Outfit_700Bold",
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 3,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 104 : 88,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 40 : 24,
          ...shadow.hard,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
          tabBarTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
          tabBarTestID: "tab-exams",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Feather name="clock" size={22} color={color} />,
          tabBarTestID: "tab-history",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
