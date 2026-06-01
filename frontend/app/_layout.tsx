import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import {
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from "@expo-google-fonts/outfit";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import { useFonts } from "expo-font";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

// Silence the noisy "Font file for X is empty" promise rejections that
// @expo/vector-icons triggers on Android Expo Go even though our CDN prewarm
// makes the icons render fine. They're cosmetic in dev mode only.
LogBox.ignoreLogs([
  /Font file for .* is empty/i,
  /ExpoFontLoader\.loadAsync/i,
]);

// Best-effort: swallow unhandled promise rejections from icon font autoloads
// so they don't show up as red Console Errors in the Expo dev menu.
if (typeof globalThis !== "undefined" && (globalThis as any).HermesInternal) {
  const original = (globalThis as any).Promise;
  if (original?.prototype?.catch) {
    // no-op — we rely on LogBox.ignoreLogs above instead of monkey-patching.
  }
}

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [appFontsLoaded, appFontsError] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const ready = (iconsLoaded || iconsError) && (appFontsLoaded || appFontsError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!ready) return null;

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFDF7" } }}
    />
  );
}
