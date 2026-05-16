import "react-native-gesture-handler";
import "react-native-reanimated";
import { Component, type ReactNode } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { colors } from "@/constants/theme";

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={errStyles.wrap}>
          <Text style={errStyles.title}>App failed to load</Text>
          <ScrollView style={errStyles.scroll}>
            <Text style={errStyles.msg}>{this.state.error.message}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  scroll: { maxHeight: 280 },
  msg: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 },
});

export default function RootLayout() {
  return (
    <RootErrorBoundary>
    <AuthProvider>
    <CartProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </CartProvider>
    </AuthProvider>
    </RootErrorBoundary>
  );
}
