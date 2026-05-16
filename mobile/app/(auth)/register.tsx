import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth, apiErrorMessage } from "@/context/AuthContext";
import { colors } from "@/constants/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleRegister() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const msg = await register(form);
      setMessage(msg);
      setTimeout(() => router.replace("/(auth)/login"), 3000);
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>
        Registration creates a customer account (same as web). Check your email to
        activate before signing in.
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!message && <Text style={styles.success}>{message}</Text>}

      {(
        [
          ["email", "Email", "email-address"],
          ["password", "Password", "default", true],
          ["password_confirm", "Confirm Password", "default", true],
          ["first_name", "First Name", "default"],
          ["last_name", "Last Name", "default"],
          ["phone", "Phone", "phone-pad"],
          ["address", "Address", "default"],
        ] as const
      ).map(([key, label, kb, secure]) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={form[key as keyof typeof form]}
            onChangeText={(t) => setField(key, t)}
            keyboardType={kb as "default"}
            secureTextEntry={secure}
            autoCapitalize={key === "email" ? "none" : "words"}
          />
        </View>
      ))}

      <Pressable style={[styles.btn, busy && styles.btnDisabled]} onPress={handleRegister} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  hint: { fontSize: 13, color: colors.muted, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700" },
  error: {
    backgroundColor: colors.errorBg,
    color: colors.error,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  success: {
    backgroundColor: colors.successBg,
    color: colors.success,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
});
