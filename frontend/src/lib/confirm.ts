import { Alert, Platform } from "react-native";

// React Native Web's Alert.alert can't render multi-button confirm dialogs
// reliably — destructive callbacks never fire. Use window.confirm on web,
// native Alert.alert on iOS/Android.
export function confirmDestructive(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  const { title, message, confirmLabel = "Delete", onConfirm, onCancel } = opts;
  if (Platform.OS === "web") {
    const ok = window.confirm([title, message].filter(Boolean).join("\n\n"));
    if (ok) onConfirm();
    else onCancel?.();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel", onPress: onCancel },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
