import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth, apiErrorMessage } from "@/context/AuthContext";
import { DevConnectionHint } from "@/components/DevConnectionHint";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>CR</Text>
          <Text style={styles.title}>Crammer's Restaurant</Text>
          <Text style={styles.sub}>Same account as web · orders sync live</Text>
        </View>

        <DevConnectionHint />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        <Pressable
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          No account?{" "}
          <Link href="/(auth)/register" style={styles.link}>
            Register
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  logo: { alignItems: "center", marginBottom: 32 },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    color: colors.primaryText,
    textAlign: "center",
    lineHeight: 56,
    fontWeight: "800",
    fontSize: 20,
    overflow: "hidden",
  },
  title: { fontSize: 22, fontWeight: "800", marginTop: 12 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.primaryText, fontWeight: "700", fontSize: 16 },
  error: {
    backgroundColor: colors.errorBg,
    color: colors.error,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  footer: { textAlign: "center", marginTop: 24, color: colors.muted },
  link: { color: colors.primary, fontWeight: "700" },
});
