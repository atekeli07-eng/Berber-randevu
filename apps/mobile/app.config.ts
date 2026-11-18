import type { ConfigContext, ExpoConfig } from "expo/config";

const projectId = process.env.EAS_PROJECT_ID ?? "00000000-0000-0000-0000-000000000000";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Berber Randevu",
  slug: "berber-randevu",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "berberrandevu",
  userInterfaceStyle: "light",
  backgroundColor: "#241c17",
  primaryColor: "#8d3d28",
  ios: {
    bundleIdentifier: "com.berberrandevu.app",
    buildNumber: "1",
    supportsTablet: true,
    infoPlist: {
      CFBundleDisplayName: "Berber Randevu",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.berberrandevu.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#241c17",
    },
  },
  plugins: [
    "expo-router",
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
