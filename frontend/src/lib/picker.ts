import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Alert, Linking, Platform } from "react-native";

async function fileToBase64(uri: string): Promise<string> {
  // On web fetch works directly; on native too.
  const res = await fetch(uri);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result is "data:<mime>;base64,XXXX" — return just the base64 portion
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
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    if (!perm.canAskAgain) openSettingsAlert("Camera");
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    base64: false,
  });
  if (res.canceled || !res.assets?.[0]?.uri) return null;
  return await fileToBase64(res.assets[0].uri);
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    if (!perm.canAskAgain) openSettingsAlert("Photo library");
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (res.canceled || !res.assets?.[0]?.uri) return null;
  return await fileToBase64(res.assets[0].uri);
}

export async function pickPdf(): Promise<{ name: string; base64: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]?.uri) return null;
  const asset = res.assets[0];
  const base64 = await fileToBase64(asset.uri);
  return { name: asset.name ?? "document.pdf", base64 };
}

export const isWeb = Platform.OS === "web";
