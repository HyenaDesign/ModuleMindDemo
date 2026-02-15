import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function PublishModuleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialTitle = typeof params.title === "string" ? params.title : "Untitled Module";
  const [moduleTitle, setModuleTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);

  const handlePublish = () => {
    // TODO: Call API to publish the module
    alert(`Module "${moduleTitle}" published successfully!`);
    router.push("/");
  };

  return (
    <View style={styles.screen}>
      {/* Top right profile */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>
      </View>

      {/* Edit button (top left) */}
      <Pressable
        style={styles.editButton}
        onPress={() => router.back()}
      >
        <Text style={styles.editIcon}>✎</Text>
      </Pressable>

      {/* Main content */}
      <View style={styles.cardBlock}>
        <View style={styles.previewCard}>
          {/* Chart/Graph Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="stats-chart" size={64} color="#BDBDBD" />
          </View>

          {/* Module info */}
          <View style={styles.infoBlock}>
            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={moduleTitle}
                onChangeText={setModuleTitle}
                placeholder="Enter module title"
                autoFocus
                onBlur={() => setIsEditing(false)}
              />
            ) : (
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={styles.moduleTitle}>{moduleTitle}</Text>
              </Pressable>
            )}
            <Text style={styles.moduleSubtitle}>Ready to publish</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsBlock}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Questions</Text>
              <Text style={styles.statValue}>8</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>Quiz</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          onPress={() => router.back()}
          style={styles.editBtn}
        >
          <Text style={styles.editBtnText}>Bewerken</Text>
        </Pressable>

        <Pressable
          onPress={handlePublish}
          style={styles.publishBtn}
        >
          <Text style={styles.publishBtnText}>Doorgaan</Text>
        </Pressable>
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
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1ECB7F",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontWeight: "700",
    color: "#FFF",
    fontSize: 16,
  },

  editButton: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  editIcon: {
    fontSize: 16,
    color: "#333",
  },

  cardBlock: {
    marginBottom: 24,
    marginTop: 20,
  },

  previewCard: {
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    padding: 28,
    alignItems: "center",
  },

  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: "#E8F8F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  infoBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  moduleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  moduleSubtitle: {
    fontSize: 14,
    color: "#666",
  },

  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#1ECB7F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 160,
    textAlign: "center",
  },

  statsBlock: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginTop: 16,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderRadius: 14,
  },

  statLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
    fontWeight: "500",
  },

  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },

  editBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  publishBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1ECB7F",
    alignItems: "center",
  },

  publishBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },

  bottomNav: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
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
    borderColor: "#1ECB7F",
    alignItems: "center",
    justifyContent: "center",
  },
});
