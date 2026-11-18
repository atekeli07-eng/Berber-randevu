import {
  parseSalonProfile,
  resolveSalonImage,
  translateError,
  type Salon,
} from "@berber/shared";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadSalonGraph } from "@/src/data";
import { pickAndUploadSalonImage } from "@/src/media";
import { getSupabase } from "@/src/supabase";
import { colors } from "@/src/theme";
import { ActionButton, ScreenTitle } from "@/src/ui";

export default function SettingsScreen() {
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [hoursSummary, setHoursSummary] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const graph = await loadSalonGraph();
      setSalon(graph.salon);
      if (loadedId !== graph.salon.id) {
        setName(graph.salon.name);
        setPhone(graph.salon.phone ?? "");
        setAddress(graph.salon.address ?? "");
        setDistrict(graph.salon.district ?? "");
        setCity(graph.salon.city ?? "");
        setDescription(graph.salon.description ?? "");
        setMapsUrl(graph.salon.maps_url ?? "");
        setInstagram(graph.salon.instagram ?? "");
        setHoursSummary(graph.salon.hours_summary ?? "");
        setLoadedId(graph.salon.id);
      }
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Salon okunamadı.");
    }
  }, [loadedId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function saveProfile() {
    if (!salon) return;
    const parsed = parseSalonProfile({
      name,
      address,
      district,
      city,
      phone,
      description,
      mapsUrl,
      instagram,
      hoursSummary,
    });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { error: updateError } = await getSupabase().from("salons").update(parsed.value).eq("id", salon.id);
      if (updateError) throw new Error(translateError(updateError));
      setSalon({ ...salon, ...parsed.value });
      setInfo("Salon bilgileri kaydedildi.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  async function chooseImage(kind: "logo" | "cover") {
    if (!salon) return;
    setPending(true);
    setError(null);
    try {
      const path = await pickAndUploadSalonImage(salon.id, kind, kind === "logo" ? salon.logo_path : salon.cover_path);
      setSalon({
        ...salon,
        logo_path: kind === "logo" ? path : salon.logo_path,
        cover_path: kind === "cover" ? path : salon.cover_path,
        updated_at: new Date().toISOString(),
      });
      setInfo(kind === "logo" ? "Logo güncellendi." : "Kapak görseli güncellendi.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Görsel yüklenemedi.";
      if (message !== "Seçim iptal edildi.") setError(message);
    } finally {
      setPending(false);
    }
  }

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

  const logoUrl = salon ? resolveSalonImage(process.env.EXPO_PUBLIC_SUPABASE_URL, salon.logo_path, salon.updated_at) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Ayarlar" kicker={salon?.city ?? "SALON"} />
        {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logo} /> : null}
        <Text style={styles.name}>{salon?.name ?? "…"}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <Field label="Salon adı" value={name} onChangeText={setName} />
        <Field label="Telefon" value={phone} onChangeText={setPhone} keyboard="phone-pad" />
        <Field label="Sokak" value={address} onChangeText={setAddress} />
        <Field label="İlçe" value={district} onChangeText={setDistrict} />
        <Field label="Şehir" value={city} onChangeText={setCity} />
        <Field label="Tanıtım" value={description} onChangeText={setDescription} multiline />
        <Field label="Çalışma saati özeti" value={hoursSummary} onChangeText={setHoursSummary} />
        <Field label="Google Maps bağlantısı" value={mapsUrl} onChangeText={setMapsUrl} />
        <Field label="Instagram" value={instagram} onChangeText={setInstagram} />
        <ActionButton label={pending ? "Kaydediliyor…" : "Bilgileri kaydet"} onPress={saveProfile} disabled={pending} />
        <ActionButton label="Logo seç" onPress={() => chooseImage("logo")} disabled={pending} />
        <ActionButton tone="ghost" label="Kapak görseli seç" onPress={() => chooseImage("cover")} disabled={pending} />
        <ActionButton tone="ghost" label="Randevu bağlantısını paylaş" onPress={shareLink} />
        <ActionButton tone="ghost" label="Çıkış yap" onPress={signOut} />
        <Text style={styles.dangerTitle}>Hesabı sil</Text>
        <Text style={styles.muted}>Salon, ekip, görseller ve randevular silinir. Onay için salon adını yazın.</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} placeholder={salon?.name ?? "Salon adı"} />
        <ActionButton tone="danger" label={pending ? "Siliniyor…" : "Hesabı ve salonu sil"} onPress={removeAccount} disabled={pending} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboard?: "phone-pad";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  logo: { width: 72, height: 72, borderRadius: 16 },
  name: { fontSize: 22, fontWeight: "700" },
  muted: { color: colors.muted, lineHeight: 20 },
  error: { color: colors.bad },
  info: { color: colors.good },
  dangerTitle: { marginTop: 12, fontSize: 18, fontWeight: "700", color: colors.bad },
  label: { fontWeight: "600", marginBottom: 4 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
});
