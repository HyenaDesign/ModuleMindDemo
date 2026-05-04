import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  loadQuizResult,
  normalizeQuizQuestions,
  type PreviewQuestion,
} from "../src/services/quizResult";

export default function ModulePreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const resultJson = typeof params.result === "string" ? params.result : null;

  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(questions.length - 1, 0));
  const current = questions[safeIndex];

  useEffect(() => {
    setQuestions(normalizeQuizQuestions(loadQuizResult(resultJson)));
    setIndex(0);
  }, [resultJson]);

  const canGoNext = safeIndex < questions.length - 1;
  const canGoPrev = safeIndex > 0;

  if (!current) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyTitle}>No AI-generated questions found.</Text>
        <Text style={styles.emptyText}>
          Upload a readable PDF, DOCX, or TXT file first.
        </Text>
        <Pressable style={styles.emptyBack} onPress={() => router.back()}>
          <Text style={styles.emptyBackText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
    >
      <View style={styles.profileCircle}>
        <Text style={styles.profileText}>P</Text>
      </View>

      <Pressable style={styles.editButton} onPress={() => router.back()}>
        <Text style={styles.editIcon}>Edit</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.progressText}>
          Question {safeIndex + 1} / {questions.length}
        </Text>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{current.question}</Text>

          {current.type === "multiple_choice" && current.options?.length ? (
            <View style={styles.optionsBlock}>
              {current.options.map((opt, optIndex) => {
                const isCorrect = opt === current.answer;
                return (
                  <View
                    key={`${opt}-${optIndex}`}
                    style={[
                      styles.optionRow,
                      isCorrect && styles.optionRowCorrect,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionCircle,
                        isCorrect && styles.optionCircleCorrect,
                      ]}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        isCorrect && styles.optionTextCorrect,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isCorrect ? (
                      <Text style={styles.checkmark}>Correct</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {current.answer ? (
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>Suggested answer</Text>
              <Text style={styles.answerText}>{current.answer}</Text>
              {current.explanation ? (
                <Text style={styles.explainText}>{current.explanation}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.btnRow}>
          <Pressable
            style={[styles.btn, !canGoPrev && styles.btnDisabled]}
            disabled={!canGoPrev}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <Text style={styles.btnText}>Back</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, !canGoNext && styles.btnDisabled]}
            disabled={!canGoNext}
            onPress={() =>
              setIndex((i) => Math.min(questions.length - 1, i + 1))
            }
          >
            <Text style={styles.btnText}>Continue</Text>
          </Pressable>
        </View>

        <View style={styles.bottomActions}>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryText}>Back to upload</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerContent: {
    minHeight: "100%",
    paddingBottom: 90,
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingTop: 140,
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: "700",
    color: "#111",
  },
  emptyText: {
    marginTop: 8,
    color: "#555",
    textAlign: "center",
  },
  emptyBack: {
    marginTop: 16,
  },
  emptyBackText: {
    color: "#111",
    textDecorationLine: "underline",
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
    minWidth: 48,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    paddingHorizontal: 8,
  },
  editIcon: { fontSize: 12, color: "#111", fontWeight: "700" },

  card: {
    marginTop: 120,
    width: "86%",
    alignSelf: "center",
    flex: 1,
  },

  progressText: {
    fontSize: 12,
    color: "#444",
    marginBottom: 10,
  },

  questionCard: {
    borderRadius: 18,
    backgroundColor: "#E6E6E6",
    padding: 14,
  },

  questionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  optionsBlock: {
    marginTop: 14,
    gap: 12,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  optionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#777",
  },

  optionText: {
    flex: 1,
    fontSize: 13,
    color: "#111",
  },

  optionRowCorrect: {
    backgroundColor: "#E9FBEF",
    borderRadius: 8,
    paddingHorizontal: 8,
  },

  optionCircleCorrect: {
    borderColor: "#05C925",
    backgroundColor: "#05C925",
  },

  optionTextCorrect: {
    color: "#05C925",
    fontWeight: "600",
  },

  checkmark: {
    fontSize: 12,
    color: "#05C925",
    fontWeight: "700",
  },

  answerBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
  },

  answerLabel: {
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },

  answerText: { color: "#111" },

  explainText: {
    marginTop: 6,
    fontSize: 12,
    color: "#444",
  },

  btnRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
  },

  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
  },

  btnDisabled: { opacity: 0.45 },

  btnText: {
    color: "#111",
    fontWeight: "700",
  },

  bottomActions: {
    marginTop: 22,
    gap: 12,
  },

  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
  },

  primaryText: {
    color: "#111",
    fontWeight: "700",
  },
});
