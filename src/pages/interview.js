// src/Interview.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { db } from "../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import "../styles/Interview.css";
import Feedback from "../components/Feedback";

// 🔹 Constants
const MAX_SESSION_MS = 15 * 60 * 1000; // 15 minutes
const INACTIVITY_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const INACTIVITY_RESPONSE_MS = 25000; // 25 seconds
const INACTIVITY_PROMPT_LIMIT = 1;

const QUESTION_POOL = {
  start: {
    text: "Hi! Tell me about yourself.",
    next: (ans = "") => {
      const a = ans.toLowerCase();
      if (a.includes("student")) return "academics";
      if (a.includes("developer") || a.includes("engineer")) return "projectExp";
      return "skills";
    },
  },
  academics: {
    text: "What are you studying and why did you pick that field?",
    next: () => "skills",
  },
  skills: {
    text: "What are your key technical skills? Please be specific.",
    next: (ans = "") => {
      const a = ans.toLowerCase();
      if (a.includes("react") || a.includes("javascript")) return "reactDeep";
      if (a.includes("python") || a.includes("ml")) return "mlProject";
      return "projectExp";
    },
  },
  reactDeep: {
    text: "Explain how React hooks work and give an example of when you'd use useEffect.",
    next: () => "stateMgmt",
  },
  stateMgmt: {
    text: "How do you manage state in a large app? Which libraries or patterns have you used?",
    next: () => "projectExp",
  },
  mlProject: {
    text: "Tell me about an ML project you worked on: dataset, approach, and outcome.",
    next: () => "challenges",
  },
  projectExp: {
    text: "Tell me about your most impressive project and your role in it.",
    next: () => "challenges",
  },
  challenges: {
    text: "What was the biggest challenge on that project and how did you overcome it?",
    next: (ans = "") =>
      ans.toLowerCase().includes("team") ? "teamwork" : "impact",
  },
  teamwork: {
    text: "Describe a time you collaborated with others. How did you handle coordination?",
    next: (ans = "") =>
      ans.toLowerCase().includes("conflict") ? "conflict" : "leadership",
  },
  conflict: {
    text: "Tell me about a conflict in a team and how you resolved it.",
    next: () => "leadership",
  },
  leadership: {
    text: "Have you led a small team? What leadership qualities did you show?",
    next: () => "impact",
  },
  impact: {
    text: "What measurable impact did your project have (users, performance, metrics)?",
    next: () => "productThinking",
  },
  productThinking: {
    text: "If you had to improve this product today, what would you do first and why?",
    next: () => "future",
  },
  future: {
    text: "Where do you see yourself in 5 years and what's one skill you want to master?",
    next: () => "whyUs",
  },
  whyUs: {
    text: "Why are you interested in this role/company?",
    next: () => "closing",
  },
  closing: {
    text: "Do you have any questions for me? If not, feel free to say 'no'.",
    next: (ans = "") => (ans.toLowerCase().includes("no") ? null : "closingFollow"),
  },
  closingFollow: {
    text: "Nice question. Anything else you'd like to add before we finish?",
    next: () => null,
  },
};

// 🔹 Keywords for scoring
const KEYWORDS = [
  "react", "javascript", "node", "express", "mongodb",
  "docker", "aws", "cloud", "sql", "nosql",
  "team", "lead", "design", "test", "performance",
  "metrics", "accuracy", "model", "python", "ml", "ai"
];

const Interview = ({ user, sessionId }) => {
  const [currentKey, setCurrentKey] = useState("start");
  const [history, setHistory] = useState([]);
  const [listening, setListening] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [finalFeedback, setFinalFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(MAX_SESSION_MS);
  const [endReason, setEndReason] = useState("");
  const [inactiveWarning, setInactiveWarning] = useState(false);

  const recognitionRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const inactivityPrompts = useRef(0);
  const sessionStartTs = useRef(Date.now());

  // 🔹 Speech helper
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

    const finishSession = useCallback(
    async (reason = "finished") => {
      if (finished) return;
      setFinished(true);
      setEndReason(reason);

      speak(
        reason === "time"
          ? "Time’s up. Thanks for completing the interview."
          : "Thanks — finishing the interview. Generating feedback now."
      );

      const allText = history.map((h) => h.a).join(" ").toLowerCase();
      let hits = 0;
      KEYWORDS.forEach((kw) => {
        if (allText.includes(kw)) hits++;
      });
      const avgLen = history.length
        ? Math.max(...history.map((h) => h.a.length))
        : 0;
      const finalScore = Math.min(
        100,
        Math.round(hits * 4 + Math.min(30, avgLen / 5) + history.length * 5)
      );

      const fb = { strengths: [], improvements: [] };
      if (hits >= 4) fb.strengths.push("Mentioned relevant technical keywords.");
      if (history.length >= 4) fb.strengths.push("Provided multiple detailed answers.");
      if (hits < 3) fb.improvements.push("Mention more specific technologies.");
      if (history.some((h) => h.a.length < 30))
        fb.improvements.push("Give longer, structured responses.");

      setFinalScore(finalScore);
      setFinalFeedback(fb);
      setShowFeedback(true);

      if (user?.uid) {
        const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
        await setDoc(
          sessionRef,
          {
            finishedAt: new Date(),
            score: finalScore,
            feedback: fb,
            finalReason: reason,
            interactions: history,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    },
    [finished, history, user, sessionId]
  );

  // 🔹 Global timer
  useEffect(() => {
    if (finished) return;
    sessionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - sessionStartTs.current;
      const remaining = Math.max(0, MAX_SESSION_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(sessionTimerRef.current);
        finishSession("time");
      }
    }, 1000);
    return () => clearInterval(sessionTimerRef.current);
  }, [finished,finishSession]);

  // 🔹 Auto speak each new question
  useEffect(() => {
    if (!finished) {
      lastInteractionRef.current = Date.now();
      const id = setTimeout(
        () => speak(QUESTION_POOL[currentKey].text),
        300
      );
      return () => clearTimeout(id);
    }
  }, [currentKey, finished]);

  // 🔹 Inactivity
  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => {
      const diff = Date.now() - lastInteractionRef.current;
      if (diff > INACTIVITY_THRESHOLD_MS && !inactiveWarning) {
        if (inactivityPrompts.current < INACTIVITY_PROMPT_LIMIT) {
          inactivityPrompts.current += 1;
          setInactiveWarning(true);
          speak("Are you there? Please say 'yes' to continue.");
          inactivityTimerRef.current = setTimeout(() => {
            const newDiff = Date.now() - lastInteractionRef.current;
            if (newDiff > INACTIVITY_THRESHOLD_MS) {
              finishSession("inactive");
            } else {
              setInactiveWarning(false);
            }
          }, INACTIVITY_RESPONSE_MS);
        } else finishSession("inactive");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [finished, inactiveWarning, finishSession]);

  // 🔹 Start listening
  const startListening = () => {
  if (finished) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("SpeechRecognition not supported.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = true;   // keep listening
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    setListening(true);

    let finalTranscript = "";
    let silenceTimer;

    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }

      // Reset silence timer every time speech is detected
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        rec.stop();  // auto-stop after 3s of silence
      }, 3000);
    };

    rec.onend = () => {
      clearTimeout(silenceTimer);
      setListening(false);
      if (finalTranscript.trim()) {
        finalizeTurn(finalTranscript.trim());
      }
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setListening(false);
    };

    rec.start();
  };


  // 🔹 Save + next
  const finalizeTurn = async (transcript) => {
    if (!transcript) return;
    const qText = QUESTION_POOL[currentKey]?.text || currentKey;
    const entry = { q: qText, a: transcript, t: new Date().toISOString() };
    setHistory((h) => [...h, entry]);
    lastInteractionRef.current = Date.now();
    setInactiveWarning(false);

    if (user?.uid) {
      const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
      await setDoc(
        sessionRef,
        {
          userId: user.uid,
          startedAt: new Date(sessionStartTs.current),
          interactions: arrayUnion(entry),
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    const nextKey = QUESTION_POOL[currentKey]?.next?.(transcript) ?? null;
    if (!nextKey) {
      finishSession("natural");
      return;
    }
    setTimeout(() => setCurrentKey(nextKey), 1200);
  };

  // 🔹 End session


  // 🔹 Reset
  const handleNextAttempt = () => {
    setCurrentKey("start");
    setHistory([]);
    setFinished(false);
    setShowFeedback(false);
    setFinalScore(null);
    setFinalFeedback(null);
    setTimeLeft(MAX_SESSION_MS);
    sessionStartTs.current = Date.now();
    lastInteractionRef.current = Date.now();
    inactivityPrompts.current = 0;
    setInactiveWarning(false);
  };

  return (
    <div className="interview-wrapper">
      <header className="interview-header">
        <div className="interview-info">
          <h1 className="interview-title">🎤 Mock Interview</h1>
          <p className="interview-subtitle">Session: {sessionId}</p>
        </div>
        <div className="timer-badge">{formatTime(timeLeft)}</div>
      </header>

      {!finished && (
        <div className="question-card">
          <h2 className="question-text">{QUESTION_POOL[currentKey].text}</h2>
          <div className="question-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                speak(QUESTION_POOL[currentKey].text);
                lastInteractionRef.current = Date.now();
              }}
            >
              🔊 Read
            </button>
            <button
              className="btn btn-primary"
              onClick={startListening}
              disabled={listening || finished}
            >
              {listening ? "🎧 Listening..." : "🎤 Answer"}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => finishSession("manual")}
            >
              ⏹ Finish
            </button>
          </div>
        </div>
      )}

      {inactiveWarning && !finished && (
        <div className="inactive-warning">
          ⚠️ Are you there? Please say 'yes' to continue.
        </div>
      )}

      <div className="transcript">
        <h3 className="transcript-heading">Transcript</h3>
        <div className="chat">
          {history.map((h, idx) => (
            <div key={idx} className={`chat-item ${idx % 2 === 0 ? "even" : "odd"}`}>
              <div className="chat-q">Q: {h.q}</div>
              <div className="chat-a">A: {h.a}</div>
            </div>
          ))}
        </div>
      </div>

      {showFeedback && (
        <div className="feedback-wrapper">
          <Feedback
            score={finalScore}
            feedback={finalFeedback}
            reason={endReason}
            onClose={() => setShowFeedback(false)}
          />
        </div>
      )}
      {/* Next Attempt - always visible after finishing */}
      {finished && (
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-success mt-2" onClick={handleNextAttempt}>
            🔄 Next Attempt
          </button>
        </div>
      )}
    </div>
  );
};

export default Interview;
