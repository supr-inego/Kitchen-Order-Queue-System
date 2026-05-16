import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth, apiErrorMessage } from "@/context/AuthContext";
import { API_BASE_URL } from "@/constants/config";
import { colors } from "@/constants/theme";

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function save() {
    setBusy(true);
    try {
      const { authAPI } = await import("@/api/auth");
      await authAPI.updateProfile(form);
      await refreshProfile();
      setEditing(false);
      Alert.alert("Saved", "Profile updated.");
    } catch (err) {
      Alert.alert("Error", apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.role}>
        {user.role === "admin" ? "Administrator" : "Customer"}
      </Text>
      <Text style={styles.api}>API: {API_BASE_URL}</Text>

      {editing ? (
        <>
          {(["first_name", "last_name", "phone", "address"] as const).map((key) => (
            <View key={key}>
              <Text style={styles.label}>{key.replace("_", " ")}</Text>
              <TextInput
                style={styles.input}
                value={form[key]}
                onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
              />
            </View>
          ))}
          <Pressable style={styles.btn} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
          </Pressable>
          <Pressable onPress={() => setEditing(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Info label="Name" value={`${user.first_name} ${user.last_name}`.trim() || "—"} />
          <Info label="Phone" value={user.phone || "—"} />
          <Info label="Address" value={user.address || "—"} />
          <Pressable style={styles.btnOutline} onPress={() => setEditing(true)}>
            <Text style={styles.btnOutlineText}>Edit profile</Text>
          </Pressable>
        </>
      )}

      <Pressable style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  email: { fontSize: 20, fontWeight: "800" },
  role: { color: colors.muted, marginTop: 4, marginBottom: 8 },
  api: { fontSize: 11, color: colors.muted, marginBottom: 20 },
  info: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase" },
  infoValue: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.card,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  btnOutlineText: { fontWeight: "700" },
  cancel: { textAlign: "center", marginTop: 12, color: colors.muted },
  logout: {
    marginTop: 32,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
    alignItems: "center",
  },
  logoutText: { color: colors.error, fontWeight: "700" },
});
