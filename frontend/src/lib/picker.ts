import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Linking, Platform } from "react-native";

const isWebPlatform = Platform.OS === "web";

// ---------- Web: hidden <input type="file"> ----------
function webPickFile(accept: string, capture?: "environment"): Promise<File | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    if (capture) input.setAttribute("capture", capture);
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.opacity = "0";

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    const handleChange = () => {
      if (settled) return;
      settled = true;
      const file = input.files && input.files[0] ? input.files[0] : null;
      cleanup();
      resolve(file);
    };
    input.addEventListener("change", handleChange, { once: true });
    (input as any).addEventListener?.("cancel", () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(null);
      }
    }, 5 * 60 * 1000);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
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

async function readNativeFileAsBase64(uri: string): Promise<string> {
  // expo-file-system's readAsStringAsync is the most reliable way to read
  // local file:// and content:// URIs into base64 on iOS/Android.
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
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

// ---------- Public API ----------
export async function pickImageFromCamera(): Promise<string | null> {
  try {
    if (isWebPlatform) {
      const file = await webPickFile("image/*", "environment");
      if (!file) return null;
      return await blobToBase64(file);
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain === false) openSettingsAlert("Camera");
      else Alert.alert("Camera access denied", "Allow camera access to snap your notes.");
      return null;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const asset = res.assets[0];
    if (asset.base64) return asset.base64;
    if (asset.uri) return await readNativeFileAsBase64(asset.uri);
    return null;
  } catch (e: any) {
    Alert.alert("Camera not available", String(e?.message ?? e ?? "Try gallery or PDF instead."));
    return null;
  }
}

export async function pickImageFromLibrary(): Promise<string | null> {
  try {
    if (isWebPlatform) {
      const file = await webPickFile("image/*");
      if (!file) return null;
      return await blobToBase64(file);
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain === false) openSettingsAlert("Photo library");
      else Alert.alert("Photo access denied", "Allow photo library access to pick an image.");
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const asset = res.assets[0];
    if (asset.base64) return asset.base64;
    if (asset.uri) return await readNativeFileAsBase64(asset.uri);
    return null;
  } catch (e: any) {
    Alert.alert("Couldn't open gallery", String(e?.message ?? e ?? "Try again."));
    return null;
  }
}

export async function pickPdf(): Promise<{ name: string; base64: string } | null> {
  try {
    if (isWebPlatform) {
      const file = await webPickFile("application/pdf");
      if (!file) return null;
      const base64 = await blobToBase64(file);
      return { name: file.name || "document.pdf", base64 };
    }
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return null;
    const asset = res.assets[0];
    const base64 = await readNativeFileAsBase64(asset.uri);
    return { name: asset.name ?? "document.pdf", base64 };
  } catch (e: any) {
    Alert.alert("Couldn't open PDF picker", String(e?.message ?? e ?? "Try again."));
    return null;
  }
}

export const isWeb = isWebPlatform;
