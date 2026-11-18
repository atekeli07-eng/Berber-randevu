import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/src/auth";
import { colors } from "@/src/theme";

export default function Index() {
  const { ready, session, configError } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }
  if (configError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.paper }}>
        <Text style={{ fontSize: 28, color: colors.ink, marginBottom: 8 }}>Ayar gerekli</Text>
        <Text style={{ color: colors.muted }}>{configError}</Text>
      </View>
    );
  }
  if (!session) return <Redirect href="/giris" />;
  return <Redirect href="/panel" />;
}
