import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function ModulePreviewScreen() {
  return (
    <View style={styles.container}>
      {}
      <View style={styles.profileCircle}>
        <Text style={styles.profileText}>P</Text>
      </View>

      {}
      <Pressable style={styles.editButton} onPress={() => {}}>
        <Text style={styles.editIcon}>✎</Text>
      </Pressable>

      {}
      <View style={styles.card}>
        <View style={styles.imageBox}>
          <Text style={styles.imageIcon}>🖼️</Text>
        </View>

        <View style={styles.lines}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
        </View>

        {}
        <View style={styles.btnRow}>
          <Pressable style={styles.disabledBtn} onPress={() => {}}>
            <Text style={styles.disabledText}>Bewerken</Text>
          </Pressable>

          <Pressable style={styles.disabledBtn} onPress={() => {}}>
            <Text style={styles.disabledText}>Doorgaan</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 120, 
  },

  profileCircle: {
    position: "absolute",
    top: 50,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  profileText: { fontWeight: "600", color: "#111" },

  editButton: {
    position: "absolute",
    top: 52,
    left: 18,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  editIcon: { fontSize: 16, color: "#111" },

  card: {
    marginTop: 120,
    width: "86%",
    alignSelf: "center",
    flex: 1,
    paddingBottom: 30,
  },

  imageBox: {
    height: 170,
    borderRadius: 18,
    backgroundColor: "#DCDCDC",
    alignItems: "center",
    justifyContent: "center",
  },
  imageIcon: { fontSize: 34 },

  lines: { marginTop: 18, gap: 10 },
  line: { height: 14, borderRadius: 7, backgroundColor: "#E6E6E6" },
  lineShort: { width: "70%" },

  btnRow: {
    flexDirection: "row",
    gap: 30,      
    marginTop: 50
  },

  disabledBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    opacity: 0.7,
  },
  disabledText: { color: "#fff", fontWeight: "600" },
});
