import type { ConfigContext, ExpoConfig } from "expo/config";

const projectId = process.env.EAS_PROJECT_ID ?? "00000000-0000-0000-0000-000000000000";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Berberimrandevu",
  slug: "berberimrandevu",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "berberimrandevu",
  userInterfaceStyle: "light",
  backgroundColor: "#241c17",
  primaryColor: "#8d3d28",
  ios: {
    bundleIdentifier: "com.berberimrandevu.app",
    buildNumber: "1",
    supportsTablet: true,
    infoPlist: {
      CFBundleDisplayName: "Berberimrandevu",
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: "Salon logosu ve kapak görseli seçmek için fotoğraf arşivi kullanılır.",
    },
  },
  android: {
    package: "com.berberimrandevu.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#241c17",
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: "Salon logosu ve kapak görseli seçmek için fotoğraf arşivi kullanılır.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        backgroundColor: "#241c17",
        imageWidth: 180,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    eas: {
      projectId,
    },
  },
  ...(process.env.EXPO_ACCOUNT_OWNER ? { owner: process.env.EXPO_ACCOUNT_OWNER } : {}),
});
