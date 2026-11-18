import {
  SALON_COVER_MAX_EDGE,
  SALON_LOGO_MAX_EDGE,
  SALON_MEDIA_BUCKET,
  isAllowedSalonImageType,
  salonImageTooLarge,
  salonMediaObjectPath,
} from "@berber/shared";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { getSupabase } from "./supabase";

export async function pickAndUploadSalonImage(salonId: string, kind: "logo" | "cover", previousPath: string | null): Promise<string> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Fotoğraf izni verilmedi.");
  }
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (picked.canceled) {
    throw new Error("Seçim iptal edildi.");
  }
  const asset = picked.assets[0];
  if (!asset) throw new Error("Görsel seçilemedi.");
  if (asset.mimeType && !isAllowedSalonImageType(asset.mimeType)) {
    throw new Error("Yalnızca JPG, PNG veya WebP seçin.");
  }
  if (asset.fileSize) {
    const tooBig = salonImageTooLarge(asset.fileSize, false);
    if (tooBig) throw new Error(tooBig);
  }

  const maxEdge = kind === "logo" ? SALON_LOGO_MAX_EDGE : SALON_COVER_MAX_EDGE;
  const width = asset.width ?? maxEdge;
  const height = asset.height ?? maxEdge;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const manipulated = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: targetWidth } }], {
    compress: 0.82,
    format: ImageManipulator.SaveFormat.WEBP,
  });
  const body = await fetch(manipulated.uri).then((response) => response.arrayBuffer());
  const stillBig = salonImageTooLarge(body.byteLength, true);
  if (stillBig) throw new Error(stillBig);

  const path = salonMediaObjectPath(salonId, kind, "webp");
  const supabase = getSupabase();
  const { error: uploadError } = await supabase.storage.from(SALON_MEDIA_BUCKET).upload(path, body, {
    upsert: true,
    contentType: "image/webp",
    cacheControl: "3600",
  });
  if (uploadError) throw new Error(uploadError.message);
  if (previousPath && previousPath !== path && !previousPath.startsWith("/") && !previousPath.startsWith("http")) {
    await supabase.storage.from(SALON_MEDIA_BUCKET).remove([previousPath]);
  }
  const column = kind === "logo" ? "logo_path" : "cover_path";
  const { error: updateError } = await supabase.from("salons").update({ [column]: path }).eq("id", salonId);
  if (updateError) throw new Error(updateError.message);
  return path;
}
