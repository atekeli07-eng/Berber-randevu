import { translateError } from "@berber/shared";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { loadSalonGraph } from "@/src/data";
import { getSupabase } from "@/src/supabase";
import { colors } from "@/src/theme";
import { ActionButton, ScreenTitle } from "@/src/ui";
import type { Salon } from "@berber/shared";

export default function SettingsScreen() {
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const graph = await loadSalonGraph();
      setSalon(graph.salon);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Salon okunamadı.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function signOut() {
    await getSupabase().auth.signOut();
    router.replace("/giris");
  }

  async function shareLink() {
    if (!salon) return;
    const site = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (!site) {
      setError("Bağlantıyı paylaşmak için EXPO_PUBLIC_SITE_URL tanımlayın.");
      return;
    }
    await Share.share({ message: `${salon.name} randevu: ${site}/s/${salon.slug}` });
  }

  async function removeAccount() {
    if (!salon || confirm.trim() !== salon.name) {
      setError("Silmek için salon adını aynen yazın.");
      return;
    }
    setPending(true);
    try {
      const supabase = getSupabase();
      const { error: rpcError } = await supabase.rpc("delete_owner_account");
      if (rpcError) throw new Error(translateError(rpcError));
      await supabase.auth.signOut();
      router.replace("/giris");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Hesap silinemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <ScreenTitle title="Ayarlar" kicker={salon?.city ?? "SALON"} />
        <Text style={styles.name}>{salon?.name ?? "…"}</Text>
        <Text style={styles.muted}>Müşteri randevusu bu uygulamada değil, web bağlantısında alınır.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ActionButton label="Randevu bağlantısını paylaş" onPress={shareLink} />
        <ActionButton tone="ghost" label="Çıkış yap" onPress={signOut} />
        <Text style={styles.dangerTitle}>Hesabı sil</Text>
        <Text style={styles.muted}>Salon, ekip ve randevular silinir. Onay için salon adını yazın.</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} placeholder={salon?.name ?? "Salon adı"} />
        <ActionButton tone="danger" label={pending ? "Siliniyor…" : "Hesabı ve salonu sil"} onPress={removeAccount} disabled={pending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 12 },
  name: { fontSize: 22, fontWeight: "700" },
  muted: { color: colors.muted, lineHeight: 20 },
  error: { color: colors.bad },
  dangerTitle: { marginTop: 12, fontSize: 18, fontWeight: "700", color: colors.bad },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
