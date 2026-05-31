import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii } from "@/src/theme";
import { pickImageFromCamera, pickImageFromLibrary, pickPdf } from "@/src/lib/picker";

export type StudyInput = {
  text: string;
  image_base64?: string;
  pdf_base64?: string;
  pdf_name?: string;
};

type Props = {
  value: StudyInput;
  onChange: (v: StudyInput) => void;
  placeholder?: string;
  showTopic?: boolean;
  topic?: string;
  onTopicChange?: (t: string) => void;
  minLines?: number;
};

export default function StudyInputBox({
  value,
  onChange,
  placeholder = "Paste your notes, text, or a question...",
  showTopic = false,
  topic = "",
  onTopicChange,
  minLines = 5,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCamera = async () => {
    setLoading("camera");
    try {
      const b64 = await pickImageFromCamera();
      if (b64) onChange({ ...value, image_base64: b64 });
    } catch (e: any) {
      Alert.alert("Couldn't open camera", e?.message ?? "");
    }
    setLoading(null);
  };

  const handleGallery = async () => {
    setLoading("gallery");
    try {
      const b64 = await pickImageFromLibrary();
      if (b64) onChange({ ...value, image_base64: b64 });
    } catch (e: any) {
      Alert.alert("Couldn't open gallery", e?.message ?? "");
    }
    setLoading(null);
  };

  const handlePdf = async () => {
    setLoading("pdf");
    try {
      const r = await pickPdf();
      if (r) onChange({ ...value, pdf_base64: r.base64, pdf_name: r.name });
    } catch (e: any) {
      Alert.alert("Couldn't open file picker", e?.message ?? "");
    }
    setLoading(null);
  };

  const clearImage = () => onChange({ ...value, image_base64: undefined });
  const clearPdf = () =>
    onChange({ ...value, pdf_base64: undefined, pdf_name: undefined });

  return (
    <View style={styles.wrap}>
      {showTopic && (
        <TextInput
          testID="topic-input"
          placeholder="Topic (optional, e.g. Photosynthesis)"
          placeholderTextColor="#888"
          value={topic}
          onChangeText={onTopicChange}
          style={[styles.input, { marginBottom: 12 }]}
        />
      )}
      <TextInput
        testID="content-input"
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value.text}
        onChangeText={(t) => onChange({ ...value, text: t })}
        multiline
        textAlignVertical="top"
        style={[styles.input, { minHeight: 24 * minLines + 24 }]}
      />

      {(value.image_base64 || value.pdf_base64) && (
        <View style={styles.attachRow}>
          {value.image_base64 && (
            <View style={styles.chip} testID="image-attached-chip">
              <Feather name="image" size={14} color={colors.textPrimary} />
              <Text style={styles.chipText}>Image attached</Text>
              <TouchableOpacity onPress={clearImage}>
                <Feather name="x" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
          {value.pdf_base64 && (
            <View style={styles.chip} testID="pdf-attached-chip">
              <Feather name="file-text" size={14} color={colors.textPrimary} />
              <Text style={styles.chipText} numberOfLines={1}>
                {value.pdf_name ?? "PDF attached"}
              </Text>
              <TouchableOpacity onPress={clearPdf}>
                <Feather name="x" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={handleCamera} testID="camera-btn" activeOpacity={0.8}>
          <Feather name="camera" size={18} color={colors.textPrimary} />
          <Text style={styles.toolText}>{loading === "camera" ? "..." : "Photo"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleGallery} testID="gallery-btn" activeOpacity={0.8}>
          <Feather name="image" size={18} color={colors.textPrimary} />
          <Text style={styles.toolText}>{loading === "gallery" ? "..." : "Gallery"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handlePdf} testID="pdf-btn" activeOpacity={0.8}>
          <Feather name="file-text" size={18} color={colors.textPrimary} />
          <Text style={styles.toolText}>{loading === "pdf" ? "..." : "PDF"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    fontSize: 15,
    fontFamily: "Figtree_500Medium",
    color: colors.textPrimary,
  },
  attachRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.mint,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 200,
  },
  chipText: { fontFamily: "Figtree_700Bold", fontSize: 12, color: colors.textPrimary },
  toolbar: { flexDirection: "row", gap: 8, marginTop: 12 },
  toolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
  },
  toolText: { fontFamily: "Outfit_700Bold", fontSize: 13, color: colors.textPrimary },
});
