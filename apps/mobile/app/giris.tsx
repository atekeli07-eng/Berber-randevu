import { isValidEmail, translateAuthError } from "@berber/shared";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth";
import { getSupabase } from "@/src/supabase";
import { colors } from "@/src/theme";
import { ActionButton, ScreenTitle } from "@/src/ui";

export default function LoginScreen() {
  const { session, configError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session) return <Redirect href="/panel" />;

  async function submit() {
    if (!isValidEmail(email) || password.length < 8) {
      setError("E-posta ve en az 8 karakterlik şifre girin.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(translateAuthError(signError));
        return;
      }
      router.replace("/panel");
    } catch (caught) {
      setError(translateAuthError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.brand}>BERBER</Text>
        <ScreenTitle title="Panele gir" kicker="SALON SAHİBİ" />
        {configError ? <Text style={styles.error}>{configError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Şifre</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
        <ActionButton label={pending ? "Giriliyor…" : "Giriş yap"} onPress={submit} disabled={pending || Boolean(configError)} />
        <Text style={styles.hint}>Müşteriler bu uygulamayı kullanmaz. Randevuyu web bağlantısından alırlar.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  body: { padding: 24, gap: 8 },
  brand: { letterSpacing: 3, fontSize: 12, fontWeight: "700", marginBottom: 12 },
  label: { marginTop: 8, fontWeight: "600" },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { color: colors.bad, marginBottom: 8 },
  hint: { color: colors.muted, marginTop: 16, lineHeight: 20 },
});
