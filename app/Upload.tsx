import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ModelOption = {
  id: "gpt-5.1" | "gpt-5.2";
  title: "OpenAI ChatGPT";
  version: "5.1" | "5.2";
};

const MODELS: ModelOption[] = [
  { id: "gpt-5.1", title: "OpenAI ChatGPT", version: "5.1" },
  { id: "gpt-5.2", title: "OpenAI ChatGPT", version: "5.2" },
];

export default function UploadScreen() {
  const [activeTab, setActiveTab] = useState<"files" | "videos">("files");
  const [selectedModel, setSelectedModel] = useState<ModelOption["id"] | null>(
    null
  );
  const [pickedName, setPickedName] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    // In your mock, button looks disabled. You can require a file too if you want:
    // return Boolean(selectedModel && pickedName);
    return Boolean(selectedModel);
  }, [selectedModel]);

  async function pickSomething() {
    // NOTE: Expo DocumentPicker can pick files. For videos, this can still work
    // depending on platform, but if you want camera roll videos, use expo-image-picker.
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
    setPickedName(asset.name ?? "Selected item");
  }

  function handleContinue() {
    if (!selectedModel) {
      Alert.alert("Choose a model first");
      return;
    }
    Alert.alert(
      "Continue",
      `Model: ${selectedModel}\nPicked: ${pickedName ?? "(none yet)"}`
    );
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
        <View style={styles.uploadCard}>
          {/* tab pill */}
          <View style={styles.tabRow}>
            <View style={styles.tabSpacer} />
            <Pressable
              onPress={() => setActiveTab("videos")}
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
                Upload videos
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={pickSomething} style={styles.uploadInner}>
            <Text style={styles.uploadText}>Upload files</Text>
            {pickedName ? (
              <Text style={styles.pickedText}>{pickedName}</Text>
            ) : null}
          </Pressable>
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
                {/* Placeholder for the OpenAI logo */}
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
        style={[styles.continueBtn, !canContinue ? styles.continueDisabled : null]}
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
    backgroundColor: "#D9D9D9",
    overflow: "hidden",
    position: "relative",
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
    backgroundColor: "#D9D9D9",
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  modelCardSelected: {
    borderColor: "#111",
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
    backgroundColor: "#CFCFCF",
  },
  continueDisabled: {
    opacity: 0.7,
  },
  continueText: { fontWeight: "700", color: "#FFF" },
  continueTextDisabled: { color: "#F5F5F5" },

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