import { formatLongDate, formatSlotTime, formatTurkishMobile, toTelHref, type Salon } from "@berber/shared";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadAppointment, setAppointmentStatus, type MobileAppointment } from "@/src/data";
import { colors } from "@/src/theme";
import { ActionButton, ScreenTitle } from "@/src/ui";

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [item, setItem] = useState<MobileAppointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const result = await loadAppointment(id);
      setSalon(result.salon);
      setItem(result.item);
      setError(result.item ? null : "Randevu bulunamadı.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Randevu açılamadı.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function update(status: "done" | "cancelled") {
    if (!id) return;
    setPending(true);
    try {
      await setAppointmentStatus(id, status);
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title={item?.customerName ?? "Randevu"} kicker="DETAY" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {item && salon ? (
          <>
            <Text style={styles.line}>{formatLongDate(new Date(item.startsAt), salon.timezone)}</Text>
            <Text style={styles.line}>{formatSlotTime(new Date(item.startsAt), salon.timezone)}</Text>
            <Text style={styles.line}>{[item.staffName, item.serviceName].filter(Boolean).join(" · ")}</Text>
            {item.status !== "blocked" ? (
              <Text style={styles.link} onPress={() => Linking.openURL(toTelHref(item.customerPhone))}>
                Ara · {formatTurkishMobile(item.customerPhone)}
              </Text>
            ) : null}
            {item.status === "booked" ? (
              <>
                <ActionButton label={pending ? "Kaydediliyor…" : "Tamamlandı"} onPress={() => update("done")} disabled={pending} />
                <ActionButton
                  tone="ghost"
                  label="İptal et"
                  disabled={pending}
                  onPress={() =>
                    Alert.alert("Randevu iptal edilsin mi?", "İptal edilen saat yeniden açılır.", [
                      { text: "Vazgeç", style: "cancel" },
                      { text: "İptal et", style: "destructive", onPress: () => update("cancelled") },
                    ])
                  }
                />
              </>
            ) : (
              <Text style={styles.muted}>
                {item.status === "done" ? "Tamamlandı" : item.status === "blocked" ? "Bu saat kapalı." : "İptal edildi"}
              </Text>
            )}
          </>
        ) : null}
        <ActionButton tone="ghost" label="Geri" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 12 },
  line: { fontSize: 16 },
  link: { color: colors.clay, fontWeight: "700", fontSize: 16 },
  error: { color: colors.bad },
  muted: { color: colors.muted },
});
