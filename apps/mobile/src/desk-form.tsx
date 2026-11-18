import {
  normalizePersonName,
  normalizeTurkishMobile,
  parseMinuteOfDay,
  zonedDate,
  type Salon,
  type Service,
  type Staff,
} from "@berber/shared";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { loadAccess, loadSalonGraph } from "./data";
import { createBlockedTime, createManualAppointment } from "./manual";
import { colors } from "./theme";
import { ActionButton } from "./ui";

export function DeskForm({ onChanged }: { onChanged: () => void }) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("10:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blockMinutes, setBlockMinutes] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const access = await loadAccess();
      const graph = await loadSalonGraph();
      const people = graph.staff.filter((person) => person.active && (access.role === "owner" || person.id === access.staffId));
      const activeServices = graph.services.filter((service) => service.active);
      setSalon(access.salon);
      setStaff(people);
      setServices(activeServices);
      setStaffId(people[0]?.id ?? "");
      setServiceId(activeServices[0]?.id ?? "");
    })();
  }, []);

  function startsAt(): Date | null {
    if (!salon || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const minute = parseMinuteOfDay(time);
    if (minute === null) return null;
    return zonedDate(day, minute, salon.timezone);
  }

  async function addAppointment() {
    const cleanName = normalizePersonName(name);
    const cleanPhone = phone.trim() ? normalizeTurkishMobile(phone) : null;
    const start = startsAt();
    if (!cleanName || !staffId || !serviceId || !start || (phone.trim() && !cleanPhone)) {
      setError("Ad, hizmet, tarih (YYYY-AA-GG) ve saat (SS:dd) gerekli. Telefon boş veya 05xx olabilir.");
      return;
    }
    try {
      await createManualAppointment({
        staffId,
        serviceId,
        startsAt: start.toISOString(),
        customerName: cleanName,
        customerPhone: cleanPhone,
      });
      setInfo("Randevu eklendi.");
      setError(null);
      setName("");
      setPhone("");
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Eklenemedi.");
    }
  }

  async function block() {
    const start = startsAt();
    const minutes = Number(blockMinutes);
    if (!staffId || !start || !Number.isInteger(minutes) || minutes < 15 || minutes % 15 !== 0) {
      setError("Kapatmak için tarih, saat ve 15 dakikanın katı bir süre girin.");
      return;
    }
    try {
      await createBlockedTime({ staffId, startsAt: start.toISOString(), durationMinutes: minutes });
      setInfo("Saat kapatıldı.");
      setError(null);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kapatılamadı.");
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Telefon veya kapıdan</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Text style={styles.label}>Personel</Text>
      <View style={styles.row}>
        {staff.map((person) => (
          <Pressable key={person.id} onPress={() => setStaffId(person.id)} style={[styles.chip, staffId === person.id && styles.chipOn]}>
            <Text style={staffId === person.id ? styles.chipTextOn : styles.chipText}>{person.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Hizmet</Text>
      <View style={styles.row}>
        {services.map((service) => (
          <Pressable key={service.id} onPress={() => setServiceId(service.id)} style={[styles.chip, serviceId === service.id && styles.chipOn]}>
            <Text style={serviceId === service.id ? styles.chipTextOn : styles.chipText}>{service.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Tarih</Text>
      <TextInput style={styles.input} value={day} onChangeText={setDay} placeholder="2026-11-20" />
      <Text style={styles.label}>Saat</Text>
      <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="10:30" />
      <Text style={styles.label}>Ad</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Telefon</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Boş bırakılabilir" />
      <ActionButton label="Randevu ekle" onPress={() => void addAppointment()} />
      <Text style={styles.title}>Saat kapat</Text>
      <TextInput style={styles.input} value={blockMinutes} onChangeText={setBlockMinutes} keyboardType="number-pad" />
      <ActionButton tone="ghost" label="Seçilen saati kapat" onPress={() => void block()} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8, marginTop: 12 },
  title: { fontSize: 18, fontWeight: "700", marginTop: 8, color: colors.ink },
  label: { fontWeight: "600", color: colors.ink },
  input: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 14, padding: 12, color: colors.ink },
  error: { color: colors.bad },
  info: { color: colors.good },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.bark, borderColor: colors.bark },
  chipText: { color: colors.ink, fontWeight: "600" },
  chipTextOn: { color: colors.card, fontWeight: "600" },
});
