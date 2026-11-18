import { salonAcceptsBookings } from "@berber/shared";
import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth";
import { loadAccess } from "@/src/data";
import { getSupabase } from "@/src/supabase";
import { colors } from "@/src/theme";
import { ActionButton } from "@/src/ui";

const TABS = [
  { href: "/panel", label: "Bugün" },
  { href: "/panel/randevular", label: "Randevu" },
  { href: "/panel/hizmetler", label: "Hizmet" },
  { href: "/panel/ayarlar", label: "Ayarlar" },
] as const;

export default function PanelLayout() {
  const { ready, session } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const path = usePathname();
  const [role, setRole] = useState<"owner" | "staff" | null>(null);
  const [gate, setGate] = useState<"loading" | "open" | "closed">("loading");
  useEffect(() => {
    if (!session) return;
    void loadAccess()
      .then((access) => {
        setRole(access.role);
        setGate(
          salonAcceptsBookings({
            trialEndsAt: access.salon.trial_ends_at,
            paidUntil: access.salon.paid_until,
            suspended: access.salon.suspended,
          })
            ? "open"
            : "closed",
        );
      })
      .catch(() => {
        setRole("owner");
        setGate("open");
      });
  }, [session]);
  if (!ready || (session && gate === "loading")) return null;
  if (!session) return <Redirect href="/giris" />;
  if (gate === "closed") {
    return (
      <View style={[styles.root, styles.closed]}>
        <Text style={styles.closedTitle}>Aboneliğiniz aktif değil, web panelinden yenileyin</Text>
        <ActionButton
          label="Çıkış yap"
          tone="ghost"
          onPress={() => {
            void getSupabase().auth.signOut();
          }}
        />
      </View>
    );
  }
  const tabs = TABS.filter((tab) => role !== "staff" || tab.href !== "/panel/hizmetler");
  const showTabs = !path.includes("/randevu/");

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      {showTabs ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {tabs.map((tab) => (
            <Pressable key={tab.href} style={styles.tab} onPress={() => router.push(tab.href)}>
              <Text style={[styles.tabText, path === tab.href && styles.tabOn]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1 },
  closed: { justifyContent: "center", padding: 28, gap: 16 },
  closedTitle: { fontSize: 22, fontWeight: "700", color: colors.ink, lineHeight: 30 },
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontWeight: "700", color: colors.muted, fontSize: 13 },
  tabOn: { color: colors.clay },
});
