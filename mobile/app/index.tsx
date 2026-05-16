import { Redirect } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/theme";

export default function Index() {
  const { loading, isLoggedIn, isAdmin } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (isAdmin) return <Redirect href="/(tabs)/admin" />;
  return <Redirect href="/(tabs)/menu" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
