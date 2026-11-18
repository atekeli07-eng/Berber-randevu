import {
  formatTry,
  parseServiceDraft,
  serviceDeleteBlockedMessage,
  type Service,
} from "@berber/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadAccess, loadSalonGraph } from "@/src/data";
import { countServiceAppointments, deleteService, insertService, loadServices, updateService } from "@/src/services";
import { colors } from "@/src/theme";
import { ActionButton, ScreenTitle } from "@/src/ui";

export default function ServicesScreen() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [role, setRole] = useState<"owner" | "staff" | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("250");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const access = await loadAccess();
      setRole(access.role);
      if (access.role !== "owner") {
        setServices([]);
        setError(null);
        return;
      }
      const graph = await loadSalonGraph();
      const rows = await loadServices(graph.salon.id);
      setSalonId(graph.salon.id);
      setServices(rows);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Hizmetler alınamadı.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function add() {
    if (!salonId) return;
    const parsed = parseServiceDraft({ name, duration, price, description });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending(true);
    try {
      await insertService(salonId, parsed.value, services.length);
      setName("");
      setDescription("");
      setError(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Hizmet eklenemedi.");
    } finally {
      setPending(false);
    }
  }

  async function save(service: Service, draft: { name: string; duration: string; price: string; description: string }) {
    const parsed = parseServiceDraft(draft);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    try {
      await updateService(service.id, parsed.value);
      setError(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Hizmet güncellenemedi.");
    }
  }

  async function toggle(service: Service) {
    try {
      await updateService(service.id, { active: !service.active });
      setError(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Durum değişmedi.");
    }
  }

  async function remove(service: Service) {
    try {
      const count = await countServiceAppointments(service.id);
      if (count > 0) {
        const message = serviceDeleteBlockedMessage(service.active);
        if (!service.active) {
          Alert.alert("Silinemedi", message);
          return;
        }
        Alert.alert("Silinemedi", message, [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Yayından kaldır",
            onPress: () => {
              void updateService(service.id, { active: false })
                .then(() => load())
                .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Durum değişmedi."));
            },
          },
        ]);
        return;
      }
      Alert.alert("Hizmeti sil", "Hizmet silinsin mi?", [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            void deleteService(service.id)
              .then(() => load())
              .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Silinemedi."));
          },
        },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Silinemedi.");
    }
  }

  return (
    <ServicesPanel
      services={services}
      error={error}
      refreshing={refreshing}
      name={name}
      duration={duration}
      price={price}
      description={description}
      pending={pending}
      role={role}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      onName={setName}
      onDuration={setDuration}
      onPrice={setPrice}
      onDescription={setDescription}
      onAdd={() => void add()}
      onSave={save}
      onToggle={toggle}
      onRemove={remove}
    />
  );
}

export function ServicesPanel({
  services,
  error,
  refreshing,
  name,
  duration,
  price,
  description,
  pending,
  role,
  onRefresh,
  onName,
  onDuration,
  onPrice,
  onDescription,
  onAdd,
  onSave,
  onToggle,
  onRemove,
}: {
  services: Service[];
  error: string | null;
  refreshing: boolean;
  name: string;
  duration: string;
  price: string;
  description: string;
  pending: boolean;
  role: "owner" | "staff" | null;
  onRefresh: () => Promise<void>;
  onName: (value: string) => void;
  onDuration: (value: string) => void;
  onPrice: (value: string) => void;
  onDescription: (value: string) => void;
  onAdd: () => void;
  onSave: (service: Service, draft: { name: string; duration: string; price: string; description: string }) => Promise<void>;
  onToggle: (service: Service) => Promise<void>;
  onRemove: (service: Service) => Promise<void>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenTitle title="Hizmetler" kicker="SALON" />
        {role === "staff" ? <Text style={styles.muted}>Hizmetleri yalnızca salon sahibi yönetir.</Text> : null}
        {role === "owner" ? <Text style={styles.muted}>Süre müsait saatleri belirler. Fiyat TL olarak yazılır.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {role === "owner" ? (
          <View style={styles.card}>
            <Field label="Ad" value={name} onChangeText={onName} placeholder="Saç kesimi" />
            <Field label="Süre (dakika)" value={duration} onChangeText={onDuration} keyboard="number-pad" />
            <Field label="Fiyat (TL)" value={price} onChangeText={onPrice} keyboard="decimal-pad" />
            <Field label="Açıklama" value={description} onChangeText={onDescription} placeholder="İsteğe bağlı" />
            <ActionButton label={pending ? "Ekleniyor…" : "Hizmet ekle"} onPress={onAdd} disabled={pending} />
          </View>
        ) : null}
        {services.length === 0 ? <Text style={styles.muted}>Henüz hizmet yok.</Text> : null}
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onSave={onSave} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({
  service,
  onSave,
  onToggle,
  onRemove,
}: {
  service: Service;
  onSave: (service: Service, draft: { name: string; duration: string; price: string; description: string }) => Promise<void>;
  onToggle: (service: Service) => Promise<void>;
  onRemove: (service: Service) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(service.name);
  const [duration, setDuration] = useState(String(service.duration_minutes));
  const [price, setPrice] = useState((service.price_kurus / 100).toLocaleString("tr-TR"));
  const [description, setDescription] = useState(service.description ?? "");

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.muted}>
            {service.duration_minutes} dk · {formatTry(service.price_kurus)}
          </Text>
        </View>
        <Pressable onPress={() => void onToggle(service)}>
          <Text style={styles.link}>{service.active ? "Yayında" : "Gizli"}</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => setOpen((value) => !value)}>
          <Text style={styles.link}>{open ? "Kapat" : "Düzenle"}</Text>
        </Pressable>
        <Pressable onPress={() => void onRemove(service)}>
          <Text style={styles.danger}>Sil</Text>
        </Pressable>
      </View>
      {open ? (
        <View style={styles.editor}>
          <Field label="Ad" value={name} onChangeText={setName} />
          <Field label="Süre (dakika)" value={duration} onChangeText={setDuration} keyboard="number-pad" />
          <Field label="Fiyat (TL)" value={price} onChangeText={setPrice} keyboard="decimal-pad" />
          <Field label="Açıklama" value={description} onChangeText={setDescription} />
          <ActionButton
            label="Güncelle"
            onPress={() => void onSave(service, { name, duration, price, description })}
          />
        </View>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboard?: "number-pad" | "decimal-pad";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboard}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  serviceName: { fontSize: 17, fontWeight: "700", color: colors.ink },
  muted: { color: colors.muted },
  error: { color: colors.bad },
  label: { fontWeight: "600", marginBottom: 4, color: colors.ink },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.ink,
  },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  link: { color: colors.clay, fontWeight: "700" },
  danger: { color: colors.bad, fontWeight: "700" },
  editor: { gap: 8 },
});
