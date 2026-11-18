import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth";
import { colors } from "@/src/theme";

const TABS = [
  { href: "/panel", label: "Bugün" },
  { href: "/panel/randevular", label: "Randevular" },
  { href: "/panel/ayarlar", label: "Ayarlar" },
] as const;

export default function PanelLayout() {
  const { ready, session } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const path = usePathname();
  if (!ready) return null;
  if (!session) return <Redirect href="/giris" />;
  const showTabs = !path.includes("/randevu/");

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      {showTabs ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((tab) => (
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
