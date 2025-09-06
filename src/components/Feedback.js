import React from "react";
import "../styles/Feedback.css";

const Feedback = ({ score, feedback, onClose }) => {
  if (!score && !feedback) return null;

  return (
    <div className="feedback-overlay">
      <div className="feedback-box">
        <h2 className="feedback-title">Interview Feedback</h2>
        <p className="feedback-score">Your Score: <strong>{score}</strong> / 100</p>

        <div className="feedback-section">
          <h3>✅ Strengths</h3>
          {feedback?.strengths?.length > 0 ? (
            <ul>
              {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p>No major strengths detected.</p>
          )}
        </div>

        <div className="feedback-section">
          <h3>⚡ Improvements</h3>
          {feedback?.improvements?.length > 0 ? (
            <ul>
              {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p>No improvements suggested.</p>
          )}
        </div>

        <button className="feedback-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Feedback;
