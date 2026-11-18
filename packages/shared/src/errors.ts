const TURKISH = /[çğıöşüÇĞİÖŞÜıİ]/;

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

export function translateAuthError(error: unknown): string {
  const message = rawMessage(error).toLowerCase();
  if (!message) return "İşlem tamamlanamadı. Tekrar deneyin.";
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Bu e-posta zaten kayıtlı. Giriş yapın.";
  }
  if (message.includes("email not confirmed")) {
    return "E-postanız henüz onaylanmamış. Gelen kutunuzu kontrol edin.";
  }
  if (message.includes("password")) {
    return "Şifre en az 8 karakter olmalı.";
  }
  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return "Geçerli bir e-posta girin.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.";
  }
  if (TURKISH.test(rawMessage(error))) return rawMessage(error);
  return "İşlem tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.";
}

export function translateError(error: unknown): string {
  const message = rawMessage(error);
  if (!message) return "Bir şeyler ters gitti. Tekrar deneyin.";
  if (message.includes("salons_slug")) return "Bu bağlantı adı kullanılıyor. Başka bir tane deneyin.";
  if (message.includes("appointments_no_overlap") || message.includes("exclusion")) {
    return "Bu saat dolu. Başka bir saat seçin.";
  }
  if (message.includes("days_off_staff_id_off_date")) return "Bu gün zaten izinli görünüyor.";
  if (message.includes("working_hours_no_overlap")) return "Çalışma saatleri birbiriyle çakışıyor.";
  if (message.includes("services_duration")) return "Süre 5 ile 480 dakika arasında tam sayı olmalı.";
  if (message.includes("violates foreign key") && message.toLowerCase().includes("staff")) {
    return "Randevusu olan personel silinemez. Pasife alın.";
  }
  if (message.includes("violates foreign key") && message.toLowerCase().includes("service")) {
    return "Randevusu olan hizmet silinemez. Yayından kaldırın.";
  }
  if (TURKISH.test(message)) {
    const line = message.split("\n")[0] ?? message;
    return line.replace(/^ERROR:\s*/i, "").trim();
  }
  return translateAuthError(error);
}
