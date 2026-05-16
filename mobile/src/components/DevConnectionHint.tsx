import { View, Text, StyleSheet, Platform } from "react-native";
import Constants from "expo-constants";
import { API_BASE_URL, devMetroHost, isApiUnreachableOnPhone } from "@/constants/config";
import { colors } from "@/constants/theme";

/**
 * Shown in dev on a real device so users don't use localhost for Expo or the API.
 */
export function DevConnectionHint() {
  if (!__DEV__) return null;

  const onPhone = Constants.isDevice;
  const metroHost = devMetroHost();
  const apiBad = isApiUnreachableOnPhone();

  if (!onPhone && !apiBad) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Phone setup</Text>
      {onPhone && !metroHost && (
        <Text style={styles.line}>
          • In the terminal run{" "}
          <Text style={styles.code}>npm run start:lan</Text> (not localhost), then scan the new QR code.
        </Text>
      )}
      {onPhone && metroHost && (
        <Text style={styles.line}>• Expo dev server: {metroHost} (OK)</Text>
      )}
      <Text style={styles.line}>• API: {API_BASE_URL}</Text>
      {apiBad && (
        <Text style={styles.warn}>
          localhost does not work on a real phone. Create{" "}
          <Text style={styles.code}>mobile/.env</Text> with your PC Wi‑Fi IP, e.g.{" "}
          <Text style={styles.code}>EXPO_PUBLIC_API_URL=http://192.168.1.5:8000/api</Text>
        </Text>
      )}
      <Text style={styles.line}>
        • Django:{" "}
        <Text style={styles.code}>python manage.py runserver 0.0.0.0:8000</Text>
      </Text>
      {Platform.OS === "android" && (
        <Text style={styles.line}>• Still stuck? Try: npm run start:tunnel</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  title: { fontWeight: "800", fontSize: 13, color: "#92400e" },
  line: { fontSize: 12, color: "#78350f", lineHeight: 18 },
  warn: { fontSize: 12, color: "#b45309", fontWeight: "600", lineHeight: 18 },
  code: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11 },
});
