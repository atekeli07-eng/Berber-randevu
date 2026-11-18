import {
  formatSlotTime,
  formatTurkishMobile,
  getAvailableSlots,
  toTelHref,
} from "@berber/shared";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import {
  loadAppointments,
  loadSalonGraph,
  todayInSalon,
  type MobileAppointment,
} from "@/src/data";
import { colors } from "@/src/theme";
import { ScreenTitle } from "@/src/ui";
import type { DayOff, Salon, Staff, WorkingHour } from "@berber/shared";

export default function TodayScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [appointments, setAppointments] = useState<MobileAppointment[]>([]);
  const [staffId, setStaffId] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const graph = await loadSalonGraph();
      const today = todayInSalon(graph.salon);
      const rows = await loadAppointments(graph.salon, today);
      setSalon(graph.salon);
      setStaff(graph.staff);
      setHours(graph.workingHours);
      setDaysOff(graph.daysOff);
      setAppointments(rows);
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

  const visible = appointments.filter((item) => staffId === "all" || item.staffId === staffId);
  const selected = staff.find((person) => person.id === staffId) ?? null;
  const openSlots =
    salon && selected
      ? getAvailableSlots({
          date: todayInSalon(salon),
          timeZone: salon.timezone,
          durationMinutes: 30,
          workingHours: hours
            .filter((row) => row.staff_id === selected.id)
            .map((row) => ({ dayOfWeek: row.day_of_week, startMinute: row.start_minute, endMinute: row.end_minute })),
          dayOff: daysOff.some((row) => row.staff_id === selected.id && row.off_date === todayInSalon(salon)),
          busy: appointments
            .filter((item) => item.staffId === selected.id && item.status !== "cancelled")
            .map((item) => ({ startsAt: new Date(item.startsAt), endsAt: new Date(item.endsAt) })),
        })
      : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        <ScreenTitle kicker="BUGÜN" title={salon?.name ?? "Salon"} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Tümü" active={staffId === "all"} onPress={() => setStaffId("all")} />
          {staff.map((person) => (
            <Chip key={person.id} label={person.name} active={staffId === person.id} onPress={() => setStaffId(person.id)} />
          ))}
        </ScrollView>
        {visible.filter((item) => item.status === "booked" || item.status === "done").length === 0 ? (
          <Text style={styles.muted}>Bugün listelenecek randevu yok.</Text>
        ) : null}
        {visible
          .filter((item) => item.status === "booked" || item.status === "done")
          .map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/panel/randevu/${item.id}`)}>
              <Text style={styles.time}>{salon ? formatSlotTime(new Date(item.startsAt), salon.timezone) : ""}</Text>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.muted}>
                {item.staffName} · {item.serviceName}
              </Text>
              <Text style={styles.link} onPress={() => Linking.openURL(toTelHref(item.customerPhone))}>
                {formatTurkishMobile(item.customerPhone)}
              </Text>
            </Pressable>
          ))}
        {selected ? (
          <View style={styles.card}>
            <Text style={styles.name}>Boş saatler · {selected.name}</Text>
            <Text style={styles.muted}>30 dakikalık bir hizmet için bugün kalan başlangıçlar.</Text>
            <Text style={styles.slots}>
              {openSlots.length === 0
                ? "Bugün boş saat kalmadı."
                : openSlots.map((slot) => (salon ? formatSlotTime(slot.startsAt, salon.timezone) : "")).join("  ")}
            </Text>
          </View>
        ) : (
          <Text style={styles.muted}>Boş saatleri görmek için bir berber seçin.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  chips: { gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.bark, borderColor: colors.bark },
  chipText: { color: colors.ink, fontWeight: "600" },
  chipTextOn: { color: colors.card },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  time: { fontSize: 22, fontWeight: "600" },
  name: { fontSize: 16, fontWeight: "700" },
  muted: { color: colors.muted },
  link: { color: colors.clay, fontWeight: "700", marginTop: 4 },
  error: { color: colors.bad },
  slots: { marginTop: 8, lineHeight: 22 },
});
