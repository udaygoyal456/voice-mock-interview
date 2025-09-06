// src/App.js
import React, { useEffect, useState } from "react";
import { auth, login, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Interview from "./pages/interview";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const startSession = () => {
    const sid = `session-${Date.now()}`; // unique session id
    setSessionId(sid);
  };

  return (
    <div className="app-wrapper">
      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">🎤 Mock Interview — Voice MVP</h1>
        <div>
          {user ? (
            <>
              <span className="app-username">Hi, {user.displayName}</span>
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={login}>
              Login with Google
            </button>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="app-main">
        {!user ? (
          <p>Please login with Google to begin the interview.</p>
        ) : !sessionId ? (
          <div className="session-start">
            <p>Welcome <strong>{user.displayName}</strong> — press start to begin your interview session.</p>
            <button className="btn btn-primary" onClick={startSession}>
              🚀 Start Interview
            </button>
          </div>
        ) : (
          <Interview user={user} sessionId={sessionId} />
        )}
      </main>
    </div>
  );
}

export default App;
