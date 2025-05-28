export default () => ({
  expo: {
    name: "Ask Dan",
    slug: "askdan",
    version: "1.0.0",
    sdkVersion: "53.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "askdan",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jordanvegas.askdan",
      ascAppId: "6746288249",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.jordanvegas.askdan",
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 26,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
          },
          ios: {
            deploymentTarget: "15.4",
          },
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "625ac1d9-43c3-474c-b57d-0f583c119404",
      },
      OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      OPENAI_ORGANIZATION: process.env.EXPO_PUBLIC_OPENAI_ORGANIZATION,
      CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      OPENAI_ASSISTANT_ID: process.env.EXPO_PUBLIC_OPENAI_ASSISTANT_ID,
      RC_APPLE_KEY: process.env.EXPO_PUBLIC_RC_APPLE_KEY,
      RC_GOOGLE_KEY: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY,
    },
  },
});
