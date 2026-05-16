import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
    </Stack>
  );
}
