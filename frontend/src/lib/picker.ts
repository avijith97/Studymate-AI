import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Alert, Linking, Platform } from "react-native";

const isWebPlatform = Platform.OS === "web";

async function fileToBase64(uri: string): Promise<string> {
  // On native, the picker may already return a base64 in the result; we still
  // fetch the uri here for a unified path that works on web + native.
  const res = await fetch(uri);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const idx = result.indexOf("base64,");
      resolve(idx >= 0 ? result.slice(idx + 7) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function openSettingsAlert(feature: string) {
  Alert.alert(
    `${feature} permission needed`,
    `Please enable ${feature.toLowerCase()} access in your settings to continue.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
}

export async function pickImageFromCamera(): Promise<string | null> {
  try {
    // On web, the camera permission API isn't always reliable; the picker itself
    // triggers the browser prompt. Skip the explicit request.
    if (!isWebPlatform) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) openSettingsAlert("Camera");
        else Alert.alert("Camera access denied", "Please allow camera access to snap your notes.");
        return null;
      }
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return null;
    return await fileToBase64(res.assets[0].uri);
  } catch (e: any) {
    Alert.alert(
      "Camera not available",
      isWebPlatform
        ? "Your browser blocked camera access. Try Gallery or PDF instead, or open the app on a phone."
        : e?.message ?? "Couldn't open camera.",
    );
    return null;
  }
}

export async function pickImageFromLibrary(): Promise<string | null> {
  try {
    if (!isWebPlatform) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) openSettingsAlert("Photo library");
        else
          Alert.alert(
            "Photo access denied",
            "Please allow photo library access to pick an image.",
          );
        return null;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return null;
    return await fileToBase64(res.assets[0].uri);
  } catch (e: any) {
    Alert.alert("Couldn't open gallery", e?.message ?? "Try again.");
    return null;
  }
}

export async function pickPdf(): Promise<{ name: string; base64: string } | null> {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return null;
    const asset = res.assets[0];
    const base64 = await fileToBase64(asset.uri);
    return { name: asset.name ?? "document.pdf", base64 };
  } catch (e: any) {
    Alert.alert("Couldn't open file picker", e?.message ?? "Try again.");
    return null;
  }
}

export const isWeb = isWebPlatform;
