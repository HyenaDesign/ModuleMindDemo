import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Question = {
  id: string;
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  image?: string;
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
        console.log("Parsed result:", parsed);
        
        let quizData = null;
        let images: string[] = [];
        
        if (Array.isArray(parsed)) {
          quizData = parsed;
        } else if (Array.isArray(parsed?.questions)) {
          quizData = parsed.questions;
          images = parsed.images || [];
        } else if (Array.isArray(parsed?.quiz)) {
          quizData = parsed.quiz;
          images = parsed.images || [];
        } else if (Array.isArray(parsed?.quiz?.questions)) {
          quizData = parsed.quiz.questions;
          images = parsed.images || [];
        } else if (parsed?.quiz && typeof parsed.quiz === 'object') {
          quizData = Array.isArray(parsed.quiz) ? parsed.quiz : [parsed.quiz];
          images = parsed.images || [];
        }

        // Transform quiz data to Question format
        if (quizData && Array.isArray(quizData) && quizData.length > 0) {
          console.log("Quiz data:", quizData);
          console.log("Images array:", images);
          console.log("Images length:", images.length);
          return quizData.map((q, idx) => {
            const answer = q.answer || q.correct_answer || q.answerIndex || q.correctAnswer || "";
            // Distribute images across questions
            const image = images[idx % images.length] || undefined;
            const imageUri = image ? `data:image/jpeg;base64,${image}` : undefined;
            console.log(`Question ${idx}: has image = ${!!image}`);
            
            return {
              id: q.id || `q${idx + 1}`,
              type: q.type || (q.choices ? "multiple_choice" : "open"),
              question: q.question || q.text || "",
              options: q.choices || q.options || q.answers || [],
              answer: answer,
              explanation: q.explanation || q.explanations || "",
              image: imageUri,
            };
          });
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

          {current.image ? (
            <Image
              source={{ uri: current.image }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          ) : null}

          {current.type === "multiple_choice" &&
          current.options?.length ? (
            <View style={styles.optionsBlock}>
              {current.options.map((opt) => {
                const isCorrect = opt === current.answer;
                return (
                  <View
                    key={opt}
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
                    {isCorrect && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                );
              })}
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
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>
              Back to upload
            </Text>
          </Pressable>

          <Pressable
            style={styles.publishBtn}
            onPress={() => {
              const filename = typeof params.result === "string" 
                ? (() => {
                    try {
                      const parsed = JSON.parse(params.result);
                      return parsed.filename || "Module";
                    } catch {
                      return "Module";
                    }
                  })()
                : "Module";

              router.push({
                pathname: "/publish-module",
                params: { title: filename },
              });
            }}
          >
            <Text style={styles.publishBtnText}>
              Publish module
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
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1ECB7F",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  profileText: { fontWeight: "600", color: "#FFF" },

  editButton: {
    position: "absolute",
    top: 52,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  editIcon: { fontSize: 16, color: "#333" },

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
    backgroundColor: "#F5F5F5",
    padding: 16,
  },

  questionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  questionImage: {
    width: "100%",
    height: 200,
    marginVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E8E8E8",
  },

  optionsBlock: {
    marginTop: 16,
    gap: 12,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },

  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
  },

  optionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  optionRowCorrect: {
    backgroundColor: "#E8F8F3",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  optionCircleCorrect: {
    borderColor: "#1ECB7F",
    backgroundColor: "#1ECB7F",
  },

  optionTextCorrect: {
    color: "#1ECB7F",
    fontWeight: "600",
  },

  checkmark: {
    fontSize: 18,
    color: "#1ECB7F",
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
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },

  btnDisabled: { opacity: 0.5 },

  btnText: {
    color: "#333",
    fontWeight: "700",
    fontSize: 15,
  },

  bottomActions: {
    marginTop: 24,
    gap: 12,
    flexDirection: "row",
  },

  backBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },

  backBtnText: {
    color: "#333",
    fontWeight: "700",
    fontSize: 15,
  },

  publishBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1ECB7F",
    alignItems: "center",
  },

  publishBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
