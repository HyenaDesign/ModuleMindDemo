import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { uploadFile } from "../src/services/upload";

type ModelOption = {
  id: "gpt-5.1" | "gpt-5.2";
  title: "OpenAI ChatGPT";
  version: "5.1" | "5.2";
};

const MODELS: ModelOption[] = [
  { id: "gpt-5.1", title: "OpenAI ChatGPT", version: "5.1" },
  { id: "gpt-5.2", title: "OpenAI ChatGPT", version: "5.2" },
];

const SAMPLE_QUESTIONS = [
  {
    id: "1",
    type: "multiple_choice" as const,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    answer: "Paris",
    explanation: "Paris is the capital and most populous city of France."
  },
  {
    id: "2",
    type: "open" as const,
    question: "Explain the concept of recursion in programming.",
    answer: "Recursion is a programming technique where a function calls itself to solve a problem.",
    explanation: "It's useful for problems that can be broken down into smaller, similar subproblems."
  }
];

type UploadStatus = "idle" | "uploading" | "success" | "failed";

export default function UploadScreen() {
    const router = useRouter();
  const [activeTab, setActiveTab] = useState<"files" | "videos">("files");
  const [selectedModel, setSelectedModel] = useState<ModelOption["id"] | null>(
    null
  );

  const [picked, setPicked] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ move debug state INSIDE the component
  const [debugJson, setDebugJson] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canContinue = useMemo(() => {
    return Boolean(selectedModel && picked) && status !== "uploading";
  }, [selectedModel, picked, status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPicked({
        uri: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        lastModified: file.lastModified,
        file: file,
      } as any);
      setStatus("idle");
      setErrorMsg(null);
    }
  };

  async function pickSomething() {
    setDebugJson("");
    setErrorMsg(null);

    if (Platform.OS === "web") {
      fileInputRef.current?.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type:
          activeTab === "videos"
            ? Platform.select({
                ios: "public.movie",
                android: "video/*",
                default: "*/*",
              })
            : "*/*",
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setPicked(asset);
      setStatus("idle");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to pick file");
      setDebugJson(e?.message ?? "Failed to pick file");
      console.error("DocumentPicker error:", e);
    }
  }

  async function handleContinue() {
    if (!selectedModel) {
      Alert.alert("Choose a model first");
      return;
    }

    if (!picked) {
      Alert.alert("Pick a file first");
      return;
    }

    try {
      setStatus("uploading");
      setErrorMsg(null);
      setDebugJson("");

      // ✅ call uploadFile ONCE and keep the result
      const result = await uploadFile({
        uri: picked.uri,
        name: picked.name ?? "upload.bin",
        mimeType: picked.mimeType ?? "application/octet-stream",
        model: selectedModel,
      });

      setStatus("success");
      setDebugJson(JSON.stringify(result, null, 2));
      Alert.alert("Upload successful ✅");
      console.log("Upload result:", result);
      router.push({
        pathname: "/module-preview",
        params: { result: JSON.stringify(result) },
      });

    } catch (e: any) {
      setStatus("failed");
      setErrorMsg(e?.message ?? "Upload failed");
      setDebugJson(e?.message ?? "Upload failed");
      Alert.alert("Upload failed ❌", e?.message ?? "Unknown error");
    }
  }

  return (
    <View style={styles.screen}>
      {/* Top right profile */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>
      </View>

      {/* Upload area */}
      <View style={styles.cardBlock}>
        <View
          style={[
            styles.uploadCard,
            status === "uploading" && styles.uploadUploading,
            status === "success" && styles.uploadSuccess,
            status === "failed" && styles.uploadFailed,
          ]}
        >
          <View style={styles.tabRow}>
            <View style={styles.tabSpacer} />
            <Pressable
              onPress={() =>
                setActiveTab((t) => (t === "files" ? "videos" : "files"))
              }
              style={[
                styles.tabPill,
                activeTab === "videos" ? styles.tabPillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "videos" ? styles.tabTextActive : null,
                ]}
              >
                {activeTab === "videos" ? "Videos" : "Files"}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={pickSomething} style={styles.uploadInner}>
            <Text style={styles.uploadText}>
              {activeTab === "videos" ? "Upload videos" : "Upload files"}
            </Text>

            {picked?.name ? (
              <Text style={styles.pickedText}>{picked.name}</Text>
            ) : null}

            {status === "uploading" ? (
              <Text style={styles.statusText}>Uploading…</Text>
            ) : status === "success" ? (
              <Text style={styles.statusText}>Upload successful ✅</Text>
            ) : status === "failed" ? (
              <>
                <Text style={styles.statusText}>Upload failed ❌</Text>
                {errorMsg ? (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}
              </>
            ) : null}
          </Pressable>
          {Platform.OS === "web" && (
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept={activeTab === "videos" ? "video/*" : "*/*"}
            />
          )}
        </View>
      </View>

      {/* Choose model */}
      <Text style={styles.sectionLabel}>Choose model</Text>

      <View style={styles.modelList}>
        {MODELS.map((m) => {
          const selected = selectedModel === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setSelectedModel(m.id)}
              style={[
                styles.modelCard,
                selected ? styles.modelCardSelected : null,
              ]}
            >
              <View style={styles.modelIcon}>
                <Text style={styles.modelIconText}>◎</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modelTitle}>{m.title}</Text>
                <Text style={styles.modelSub}>{m.version}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Continue button */}
      <Pressable
        onPress={handleContinue}
        disabled={!canContinue}
        style={[
          styles.continueBtn,
          !canContinue ? styles.continueDisabled : null,
        ]}
      >
        <Text
          style={[
            styles.continueText,
            !canContinue ? styles.continueTextDisabled : null,
          ]}
        >
          Doorgaan
        </Text>
      </Pressable>

      {/* ✅ Debug JSON output */}
      {debugJson ? (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>Debug JSON</Text>
          <Text selectable style={styles.debugText}>
            {debugJson}
          </Text>
        </View>
      ) : null}

      {/* Live Demo */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>Live Demo</Text>
        <Text style={styles.demoSubtitle}>See what your uploaded content looks like</Text>
        <View style={styles.demoQuestions}>
          {SAMPLE_QUESTIONS.map((q, index) => (
            <View key={q.id} style={styles.demoQuestion}>
              <Text style={styles.demoQuestionText}>
                {index + 1}. {q.question}
              </Text>
              {q.type === "multiple_choice" && q.options ? (
                <View style={styles.demoOptions}>
                  {q.options.map((opt, i) => (
                    <Text key={i} style={styles.demoOption}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.demoAnswer}>Answer: {q.answer}</Text>
              )}
              <Text style={styles.demoExplanation}>Explanation: {q.explanation}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Ionicons name="settings-outline" size={28} color="#111" />
        </Pressable>

        <Pressable style={styles.navItemCenter}>
          <View style={styles.plusBox}>
            <Ionicons name="add" size={34} color="#111" />
          </View>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Ionicons name="person-outline" size={28} color="#111" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 18,
    paddingTop: 40,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: "#444" },

  cardBlock: { marginBottom: 18 },
  uploadCard: {
    height: 210,
    borderRadius: 16,
    backgroundColor: "#E6E6E6",
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },

  uploadUploading: { borderColor: "#FFDF0D", backgroundColor: "#FFF8CC" },
  uploadSuccess: { borderColor: "#05C925", backgroundColor: "#E9FBEF" },
  uploadFailed: { borderColor: "#E54848", backgroundColor: "#FDECEC" },

  statusText: {
    marginTop: 10,
    fontWeight: "600",
    color: "#222",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#E54848",
    textAlign: "center",
  },

  tabRow: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  tabSpacer: {
    flex: 1,
    height: 1,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#BDBDBD",
  },
  tabPillActive: {
    backgroundColor: "#B3B3B3",
  },
  tabText: {
    fontSize: 12,
    color: "#2B2B2B",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#1E1E1E",
  },

  uploadInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    minHeight: 180,
    cursor: "pointer",
  },
  uploadText: { color: "#2E2E2E", fontWeight: "600" },
  pickedText: { marginTop: 8, fontSize: 12, color: "#444" },

  sectionLabel: {
    fontSize: 14,
    color: "#222",
    marginBottom: 10,
  },

  modelList: { gap: 12 },
  modelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E6E6E6",
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent",
    cursor: "pointer",
  },
  modelCardSelected: {
    borderColor: "#05C925",
    backgroundColor: "#E9FBEF",
  },
  modelIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  modelIconText: { fontSize: 20, fontWeight: "800", color: "#111" },
  modelTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  modelSub: { fontSize: 12, color: "#444", marginTop: 2 },

  continueBtn: {
    alignSelf: "flex-end",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#04B120",
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueText: { fontWeight: "500", color: "#FFF" },
  continueTextDisabled: { color: "#FFF" },

  // ✅ debug styles
  debugBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F3F3F3",
    maxHeight: 260,
  },
  debugTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  demoSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  demoQuestions: {
    gap: 16,
  },
  demoQuestion: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
  },
  demoQuestionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  demoOptions: {
    marginBottom: 8,
  },
  demoOption: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  demoAnswer: {
    fontSize: 14,
    color: "#1ECB7F",
    fontWeight: "600",
    marginBottom: 8,
  },
  demoExplanation: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },

  bottomNav: {
    marginTop: "auto",
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  navItem: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemCenter: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  plusBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
});