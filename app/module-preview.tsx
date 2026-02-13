import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Question = {
  id: string;
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
};

export default function ModulePreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const resultJson =
    typeof params.result === "string" ? params.result : null;

  const questions: Question[] = useMemo(() => {
    if (resultJson) {
      try {
        const parsed = JSON.parse(resultJson);
        
        let quizData = null;
        if (Array.isArray(parsed)) {
          quizData = parsed;
        } else if (Array.isArray(parsed?.questions)) {
          quizData = parsed.questions;
        } else if (Array.isArray(parsed?.quiz)) {
          quizData = parsed.quiz;
        } else if (Array.isArray(parsed?.quiz?.questions)) {
          quizData = parsed.quiz.questions;
        } else if (parsed?.quiz && typeof parsed.quiz === 'object') {
          quizData = Array.isArray(parsed.quiz) ? parsed.quiz : [parsed.quiz];
        }

        // Transform quiz data to Question format
        if (quizData && Array.isArray(quizData) && quizData.length > 0) {
          console.log("Quiz data:", quizData);
          return quizData.map((q, idx) => ({
            id: q.id || `q${idx + 1}`,
            type: q.type || (q.choices ? "multiple_choice" : "open"),
            question: q.question || q.text || "",
            options: q.choices || q.options || [],
            answer: q.answer || q.correct_answer || "",
            explanation: q.explanation || "",
          }));
        }
      } catch (e) {
        console.log("Parse error:", e);
      }
    }

    // ✅ Mock fallback (so screen works without backend)
    return [
      {
        id: "q1",
        type: "multiple_choice",
        question: "What is the center of a circle called?",
        options: ["Radius", "Diameter", "Center point", "Arc"],
        answer: "Center point",
        explanation:
          "The center is the point equally distant from all points on the circle.",
      },
      {
        id: "q2",
        type: "open",
        question:
          "Explain why STEM subjects require practice instead of only reading.",
        answer:
          "Because you need to apply concepts, solve problems and receive feedback.",
      },
    ];
  }, [resultJson]);

  const [index, setIndex] = useState(0);
  const current = questions[index];

  const canGoNext = index < questions.length - 1;
  const canGoPrev = index > 0;

  if (!current) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: 140, alignItems: "center" },
        ]}
      >
        <Text style={{ fontWeight: "700" }}>
          No questions found.
        </Text>
        <Pressable
          style={{ marginTop: 16 }}
          onPress={() => router.back()}
        >
          <Text
            style={{
              color: "#111",
              textDecorationLine: "underline",
            }}
          >
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top right profile */}
      <View style={styles.profileCircle}>
        <Text style={styles.profileText}>P</Text>
      </View>

      {/* Top left edit icon (goes back for now) */}
      <Pressable
        style={styles.editButton}
        onPress={() => router.back()}
      >
        <Text style={styles.editIcon}>✎</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.progressText}>
          Question {index + 1} / {questions.length}
        </Text>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {current.question}
          </Text>

          {current.type === "multiple_choice" &&
          current.options?.length ? (
            <View style={styles.optionsBlock}>
              {current.options.map((opt) => (
                <View key={opt} style={styles.optionRow}>
                  <View style={styles.optionCircle} />
                  <Text style={styles.optionText}>
                    {opt}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {current.answer ? (
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>
                Suggested answer
              </Text>
              <Text style={styles.answerText}>
                {current.answer}
              </Text>
              {current.explanation ? (
                <Text style={styles.explainText}>
                  {current.explanation}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.btnRow}>
          <Pressable
            style={[
              styles.btn,
              !canGoPrev && styles.btnDisabled,
            ]}
            disabled={!canGoPrev}
            onPress={() =>
              setIndex((i) => Math.max(0, i - 1))
            }
          >
            <Text style={styles.btnText}>Back</Text>
          </Pressable>

          <Pressable
            style={[
              styles.btn,
              !canGoNext && styles.btnDisabled,
            ]}
            disabled={!canGoNext}
            onPress={() =>
              setIndex((i) =>
                Math.min(questions.length - 1, i + 1)
              )
            }
          >
            <Text style={styles.btnText}>
              Continue
            </Text>
          </Pressable>
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryText}>
              Back to upload
            </Text>
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
    paddingBottom: 90,
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
