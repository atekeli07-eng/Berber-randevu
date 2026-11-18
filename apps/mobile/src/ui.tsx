import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

export function ScreenTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <View style={styles.titleBlock}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  tone = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, tone === "ghost" && styles.ghost, tone === "danger" && styles.danger, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, tone === "ghost" && styles.ghostText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 4, marginBottom: 16 },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 32, fontWeight: "600" },
  button: {
    backgroundColor: colors.clay,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.bad },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.card, fontWeight: "700" },
  ghostText: { color: colors.ink },
});
