import { addCalendarDays, formatDayHeading, formatSlotTime, formatTurkishMobile } from "@berber/shared";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadAppointments, loadSalonGraph, todayInSalon, type MobileAppointment } from "@/src/data";
import { colors } from "@/src/theme";
import { ScreenTitle } from "@/src/ui";
import type { Salon } from "@berber/shared";

export default function AppointmentsScreen() {
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [rows, setRows] = useState<MobileAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dateRef = useRef<string | null>(null);

  const load = useCallback(async (nextDate?: string) => {
    try {
      const graph = await loadSalonGraph();
      const day = nextDate ?? dateRef.current ?? todayInSalon(graph.salon);
      dateRef.current = day;
      const list = await loadAppointments(graph.salon, day);
      setSalon(graph.salon);
      setDate(day);
      setRows(list);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Liste alınamadı.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <ScreenTitle title="Randevular" kicker={date && salon ? formatDayHeading(date, salon.timezone) : "GÜN"} />
        <View style={styles.row}>
          <Pressable onPress={() => date && load(addCalendarDays(date, -1))}><Text style={styles.link}>Önceki gün</Text></Pressable>
          <Pressable onPress={() => salon && load(todayInSalon(salon))}><Text style={styles.link}>Bugün</Text></Pressable>
          <Pressable onPress={() => date && load(addCalendarDays(date, 1))}><Text style={styles.link}>Sonraki gün</Text></Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {rows.length === 0 ? <Text style={styles.muted}>Bu günde randevu yok.</Text> : null}
        {rows.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/panel/randevu/${item.id}`)}>
            <Text style={styles.time}>
              {salon ? formatSlotTime(new Date(item.startsAt), salon.timezone) : ""} · {item.customerName}
            </Text>
            <Text style={styles.muted}>
              {item.staffName} · {item.serviceName} · {formatTurkishMobile(item.customerPhone)}
            </Text>
            <Text style={styles.status}>{item.status === "booked" ? "Rezerve" : item.status === "done" ? "Tamamlandı" : "İptal"}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  link: { color: colors.clay, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  time: { fontSize: 16, fontWeight: "700" },
  muted: { color: colors.muted },
  status: { color: colors.gold, fontWeight: "700", marginTop: 4 },
  error: { color: colors.bad },
});
