import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Vapi from "@vapi-ai/web";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, updateDoc } from "firebase/firestore";
import {
  FaClock,
  FaMicrophone,
  FaPhoneSlash,
  FaRobot,
  FaUserCircle,
  FaVideo,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { db } from "../firebase";

const FEEDBACK_MODEL_NAME = "gemini-2.5-flash";
const FEEDBACK_FALLBACK_MODEL_NAME = "gemini-2.5-flash-lite";

const AIVideoInterview = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [conversationLog, setConversationLog] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState("Initializing voice interview...");
  const [callError, setCallError] = useState("");
  const currentQuestionRef = useRef("");
  const lastAssistantQuestionRef = useRef("");
  const vapiRef = useRef(null);

  if (!vapiRef.current) {
    vapiRef.current = new Vapi(import.meta.env.VITE_VAPI_API_KEY);
  }

  const hasValidInterviewData =
    state &&
    state.name &&
    state.position &&
    Array.isArray(state.Question);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    if (currentQuestion) {
      lastAssistantQuestionRef.current = currentQuestion;
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (!hasValidInterviewData) {
      return undefined;
    }

    const { name, position, Question } = state;
    const vapi = vapiRef.current;
    const formattedQuestions = Question.map(
      (q, i) => `${i + 1}. ${q.question}`
    ).join("\n");

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${name}, how are you? Ready for your interview on ${position}?`,
      firstMessageMode: "assistant-speaks-first",
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "openai",
        voiceId: "alloy",
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions and assess their responses.
Begin with a friendly introduction and keep the tone relaxed yet professional.
Ask one question at a time and wait for the candidate's response before proceeding.
Questions: ${formattedQuestions}
If the candidate struggles, offer hints or rephrase the question without giving away the answer.
Provide brief, encouraging feedback after each answer.
Keep the conversation natural and engaging.
After 5-7 questions, wrap up the interview by summarizing their performance.
End on a positive note and keep the interview focused on ${position}.
`.trim(),
          },
        ],
      },
    };

    const handleCallStart = () => {
      setCallError("");
      setCallStatus("Interview is live. The AI should begin speaking now.");
    };

    const handleCallEnd = () => {
      setCallStatus("Interview call ended.");
    };

    const handleSpeechStart = (event) => {
      if (event.speaker === "user") setIsUserSpeaking(true);
      if (event.speaker === "assistant") setIsAiSpeaking(true);
    };

    const handleSpeechEnd = (event) => {
      if (event.speaker === "user") setIsUserSpeaking(false);
      if (event.speaker === "assistant") setIsAiSpeaking(false);
    };

    const handleMessage = (message) => {
      if (message.type === "status-update" && message.status) {
        setCallStatus(`Call status: ${message.status}`);
      }

      if (message.type === "text" && message.source === "assistant") {
        setCurrentQuestion(message.message);
        setCallStatus("AI is asking a question.");
      }

      if (
        message.type === "transcript" &&
        message.role === "user" &&
        message.transcript?.trim()
      ) {
        setConversationLog((prev) => [
          ...prev,
          {
            question:
              lastAssistantQuestionRef.current ||
              currentQuestionRef.current ||
              "Interview question not captured",
            answer: message.transcript.trim(),
          },
        ]);
      }
    };

    const handleError = (error) => {
      console.error("Vapi error:", error);
      const message =
        error?.errorMsg ||
        error?.details?.message ||
        error?.details?.error ||
        error?.details?.endedReason ||
        error?.endedReason ||
        error?.message ||
        error?.error?.message ||
        "Voice interview could not start. Check microphone permission and your Vapi dashboard provider setup.";
      setCallError(message);
      setCallStatus("Voice interview failed to start.");
    };

    setCallStatus("Requesting microphone and starting the AI interviewer...");

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);
    vapi.start(assistantOptions).catch(handleError);

    return () => {
      vapi.stop();
    };
  }, [hasValidInterviewData, state]);

  if (!hasValidInterviewData) {
    return (
      <div className="text-center mt-20 text-red-600 font-semibold">
        Missing or invalid interview data.
      </div>
    );
  }

  const { name, position, skills, experience, submissionId } = state;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const isRetriableGeminiError = (error) => {
    const message = error?.message || "";
    return (
      message.includes("[503") ||
      message.includes("high demand") ||
      message.includes("temporarily unavailable") ||
      message.includes("overloaded")
    );
  };

  const generateFeedbackResponse = async (prompt) => {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const modelsToTry = [FEEDBACK_MODEL_NAME, FEEDBACK_FALLBACK_MODEL_NAME];
    let lastError;

    for (const modelName of modelsToTry) {
      const model = genAI.getGenerativeModel({ model: modelName });

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const result = await model.generateContent(prompt);
          return await result.response.text();
        } catch (error) {
          lastError = error;

          if (!isRetriableGeminiError(error) || attempt === 3) {
            break;
          }

          await delay(1000 * 2 ** (attempt - 1));
        }
      }
    }

    throw lastError;
  };

  const generateFeedback = async () => {
    setLoadingFeedback(true);
    try {
      if (conversationLog.length === 0) {
        const emptyFeedback = {
          strengths: "No spoken answers were captured during the interview.",
          improvements:
            "Allow microphone access and answer at least one question before ending the interview.",
          communicationClarityScore: null,
          relevanceScore: null,
          overallScore: null,
          detailedFeedback:
            "Feedback could not be generated because no user transcript was captured.",
        };
        setFeedback(emptyFeedback);
        return emptyFeedback;
      }

      const transcriptText = conversationLog
        .map(
          (entry, i) =>
            `Q${i + 1}: ${entry.question}\nA: ${entry.answer || "No answer provided"}`
        )
        .join("\n\n");

      const prompt = `
You are an expert recruiter AI. Given the following interview transcript, analyze the candidate's answers for the role of ${position} and provide detailed feedback.

Please respond ONLY with a JSON object containing:
- strengths: a brief summary of strengths
- improvements: areas of improvement
- communicationClarityScore: a score from 1 to 10
- relevanceScore: a score from 1 to 10
- overallScore: a score from 1 to 10
- detailedFeedback: a concise paragraph summary

If the transcript is short or incomplete, still return valid JSON and explain the limitation in detailedFeedback.

Transcript:
${transcriptText}
      `.trim();

      const rawText = await generateFeedbackResponse(prompt);

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in AI response.");
        }
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Failed to parse JSON extracted from AI response.");
        }
      }

      const keys = [
        "strengths",
        "improvements",
        "communicationClarityScore",
        "relevanceScore",
        "overallScore",
        "detailedFeedback",
      ];

      if (!keys.every((key) => key in parsed)) {
        setFeedback("Feedback generated but incomplete format received.");
        return {
          strengths: "",
          improvements: "",
          communicationClarityScore: null,
          relevanceScore: null,
          overallScore: null,
          detailedFeedback:
            "Feedback generated but some expected fields are missing.",
        };
      }

      const clampScore = (score) =>
        typeof score === "number" ? Math.min(10, Math.max(1, score)) : null;

      parsed.communicationClarityScore = clampScore(
        parsed.communicationClarityScore
      );
      parsed.relevanceScore = clampScore(parsed.relevanceScore);
      parsed.overallScore = clampScore(parsed.overallScore);

      setFeedback(parsed);
      return parsed;
    } catch (error) {
      console.error("Feedback generation error:", error);
      const message = isRetriableGeminiError(error)
        ? "Gemini is under heavy load right now. The app retried automatically, but feedback could not be generated yet. Please try the interview feedback again in a moment."
        : error?.message || "Unable to generate feedback at this time.";
      setFeedback(message);
      return {
        strengths: "",
        improvements: "",
        communicationClarityScore: null,
        relevanceScore: null,
        overallScore: null,
        detailedFeedback: message,
      };
    } finally {
      setLoadingFeedback(false);
    }
  };

  const endInterview = async () => {
    setInterviewEnded(true);
    vapiRef.current.stop();

    const newFeedback = await generateFeedback();

    if (submissionId) {
      try {
        const overallScore =
          typeof newFeedback?.overallScore === "number"
            ? newFeedback.overallScore
            : null;

        await updateDoc(doc(db, "interview_submissions", submissionId), {
          status: "Completed",
          feedback:
            typeof newFeedback?.detailedFeedback === "string"
              ? newFeedback.detailedFeedback
              : typeof newFeedback === "string"
              ? newFeedback
              : "",
          strengths:
            typeof newFeedback?.strengths === "string"
              ? newFeedback.strengths
              : "",
          improvements:
            typeof newFeedback?.improvements === "string"
              ? newFeedback.improvements
              : "",
          tips:
            typeof newFeedback?.improvements === "string"
              ? newFeedback.improvements
              : "",
          score: overallScore !== null ? overallScore * 10 : null,
          communicationClarityScore:
            newFeedback?.communicationClarityScore ?? null,
          relevanceScore: newFeedback?.relevanceScore ?? null,
          overallScore,
          transcript: conversationLog,
          completedAt: new Date(),
        });
      } catch (error) {
        console.error("Failed to save interview feedback:", error);
      }
    }

    navigate("/dashboard/feedback", {
      state: {
        transcript: conversationLog,
        feedback: newFeedback,
      },
    });
  };

  return (
    <motion.div
      className="px-6 py-10 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <FaClock className="text-purple-600 text-xl" />
        <h2 className="text-3xl font-bold text-purple-800">
          AI Interview Interface
        </h2>
      </div>

      <div className="w-full max-w-4xl mb-6 space-y-3">
        <div className="rounded-xl border border-purple-200 bg-white px-4 py-3 text-center text-sm font-medium text-purple-800 shadow-sm">
          {callStatus}
        </div>
        {callError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 shadow-sm">
            {callError}
          </div>
        )}
        {currentQuestion && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-800 shadow-sm">
            Current prompt: {currentQuestion}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl relative h-[400px] flex flex-col items-center justify-center border border-purple-100"
        >
          <FaUserCircle
            className={`text-purple-500 text-8xl mb-3 ${
              isUserSpeaking ? "animate-pulse" : ""
            }`}
          />
          <span className="text-gray-700 font-semibold text-lg">You</span>
          <div className="absolute top-4 right-4 flex gap-3">
            <FaMicrophone
              className="text-gray-400 hover:text-purple-600 transition"
              size={20}
            />
            <FaVideo
              className="text-gray-400 hover:text-purple-600 transition"
              size={20}
            />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl relative h-[400px] flex flex-col items-center justify-center border border-purple-100"
        >
          <FaRobot
            className={`text-blue-500 text-8xl mb-3 ${
              isAiSpeaking ? "animate-pulse" : ""
            }`}
          />
          <span className="text-gray-700 font-semibold text-lg">
            AI Interviewer
          </span>
          <div className="absolute top-4 right-4 flex gap-3">
            <FaMicrophone
              className="text-gray-400 hover:text-blue-600 transition"
              size={20}
            />
            <FaVideo
              className="text-gray-400 hover:text-blue-600 transition"
              size={20}
            />
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <span className="bg-purple-200 text-purple-800 text-sm font-semibold px-4 py-2 rounded-full">
          Name: {name}
        </span>
        <span className="bg-green-200 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
          Position: {position}
        </span>
        <span className="bg-blue-200 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full">
          Skills: {skills}
        </span>
        <span className="bg-yellow-200 text-yellow-800 text-sm font-semibold px-4 py-2 rounded-full">
          Experience: {experience} {experience > 1 ? "years" : "year"}
        </span>
      </div>

      {!interviewEnded ? (
        <motion.button
          onClick={endInterview}
          whileTap={{ scale: 0.95 }}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center gap-3 text-lg font-semibold shadow-lg transition"
        >
          <FaPhoneSlash />
          End Interview
        </motion.button>
      ) : (
        <motion.p
          className="mt-4 text-red-600 text-xl font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Interview Ended.
        </motion.p>
      )}

      {interviewEnded && (
        <div className="w-full max-w-4xl mt-10">
          <h3 className="text-xl font-semibold text-green-700 mb-4">
            Feedback Summary
          </h3>
          {loadingFeedback ? (
            <p className="text-gray-500">Generating feedback...</p>
          ) : (
            <div className="bg-white p-5 border border-green-200 rounded-xl shadow text-gray-800 whitespace-pre-line">
              {typeof feedback === "string" ? (
                feedback
              ) : feedback && feedback.detailedFeedback ? (
                <>
                  <p>
                    <strong>Strengths:</strong> {feedback.strengths}
                  </p>
                  <p>
                    <strong>Improvements:</strong> {feedback.improvements}
                  </p>
                  <p>
                    <strong>Communication Clarity Score:</strong>{" "}
                    {feedback.communicationClarityScore}
                  </p>
                  <p>
                    <strong>Relevance Score:</strong> {feedback.relevanceScore}
                  </p>
                  <p>
                    <strong>Overall Score:</strong> {feedback.overallScore}
                  </p>
                  <p>
                    <strong>Summary:</strong> {feedback.detailedFeedback}
                  </p>
                </>
              ) : (
                "No feedback available."
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AIVideoInterview;
