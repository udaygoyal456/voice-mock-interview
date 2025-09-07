# Interview App – Voice-Based Mock Interview Platform  

A web app that simulates real product management interviews.  
The system acts as the interviewer, asks questions, listens to the candidate’s answers, and continues the conversation naturally.  
At the end, it provides feedback and stores the performance score.  

---

## 🚀 Features
- 🎙️ Voice-based Q&A (not just text input)  
- 🤖 AI-driven interviewer flow  
- 📊 Feedback & scoring system  
- 🔑 Google Authentication with Firebase  
- 🌐 Deployed on Vercel  

---

## 🛠️ Tech Stack
- **Frontend:** React.js, TailwindCSS  
- **Voice Processing:** Web Speech API (speech-to-text, text-to-speech)  
- **Authentication:** Firebase (Google Login)  
- **Deployment:** Vercel  
- **Other Tools:** Git, GitHub  

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/interview-app.git
   cd interview-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a .env file in the root with your Firebase keys:**
   ```bash
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Run development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

---

## 🎨 Design Decisions
- Chose Firebase Auth for easy and secure login.  
- Used Web Speech API for natural voice interaction.  
- Opted for React + TailwindCSS to build a fast, responsive UI.  
- Deployed on Vercel for instant sharing and testing.  

---

## 🔮 Next Steps (if given more time)
- Add different interview roles (e.g., tech, HR, behavioral).  
- Enhance feedback with analytics dashboards.  
- Save interview transcripts for practice review.  
- Add multi-language support.  
- Enable video interview mode.  

---

## 📬 Contact
- **Author:** Uday Goyal  
- **Email:** udaygoyal456@gmail.com  
- **Phone:** +91 9354441466  
- **Portfolio:** [My Portfolio](https://udaygoyal.vercel.app/)  
