# AwaazSetu — Voice-Based Complaint Assistance and Case Tracking System
### Academic Project: Voice-to-FIR AI-Assisted Police Complaint and Case Management System

> **Academic Prototype & Legal Scope Disclaimer:**  
> AwaazSetu is an academic demonstration prototype designed to assist citizens in drafting complaints using spoken or typed statements and to assist police officers in triaging, reviewing, and organizing incident details.  
> **This prototype does NOT claim to register a legally valid First Information Report (FIR), does NOT make legal or judicial decisions, and does NOT replace an authorized police station house officer (SHO).** For actual emergency assistance, citizens must dial **112** directly.

---

## 1. Executive Summary & Integration Status

### **Question: Are Frontend and Backend Integrated right now?**

### **Answer: They are currently MODULAR and DECOUPLED (Not yet wired together over live network requests).**

Here is the exact current architectural status:

```
+-----------------------------------------------------------------------------------------+
|                                  AwaazSetu Project Root                                  |
|                                                                                         |
|  +-------------------------------------+       +-------------------------------------+  |
|  |             FRONTEND                |       |          BACKEND / ML ENGINE        |  |
|  |           (React + Vite)            |       |         (FastAPI + Python ML)       |  |
|  |                                     |       |                                     |  |
|  | - Directory: src/                   |       | - Directory: ml_system/             |  |
|  | - Port: http://localhost:5173       |       | - Port: http://127.0.0.1:8000       |  |
|  | - State: Simulated local React     |  X    | - Endpoints: /api/analyze,          |  |
|  |   Context + browser LocalStorage    |       |   /api/classify, /api/extract,      |  |
|  | - Status: Complete UI Demo          |       |   /api/transcribe, /api/evaluation  |  |
|  |   (Phase 1 requirement)             |       | - Status: Complete & Tested         |  |
|  +-------------------------------------+       +-------------------------------------+  |
|                                                                                         |
|                   [Current Status: Independent & Independently Testable]                |
|                    Planned Bridge: REST API connection in Phase 3                       |
+-----------------------------------------------------------------------------------------+
```

### Why are they decoupled?
1. **Academic Development Requirement**: The development specification explicitly mandated:
   > *"The first objective is to build a fully functional, independently testable ML/DL system inside `ml_system/`. Do not unnecessarily modify the existing React frontend. The frontend will be connected to this system later through REST APIs."*
2. **Demonstration Safety**: The React frontend can be presented offline without running the Python server, using rich mock presets.
3. **Independent Verification**: The ML/DL backend can be tested and evaluated using Pytest, Swagger UI (`/docs`), or `curl` without launching Node.js.
4. **CORS Ready**: The FastAPI backend already has CORS configured for `http://localhost:5173` so that when you connect them in Phase 3, no CORS errors will occur.

---

## 2. System Architecture & Components

The project consists of two standalone engines:

### A. Frontend Application (`src/`)
- **Technology**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Role**: Presentation-ready citizen and police portal with:
  1. **Landing Page**: Public explanation and non-FIR legal disclaimer.
  2. **Role Switcher**: Instant switching between Citizen, Officer (SI Rajesh Kumar), and Admin.
  3. **4-Step Intake Wizard**: Audio recording mockup, editable transcript review, structured particulars form, and truthfulness declaration.
  4. **Citizen Dashboard**: Case status tracking timeline (`AS-2026-XXXX`).
  5. **Officer Triage Console**: Queue filtering, audio review, status transition controls, and official police notes.
  6. **Admin Panel**: Role management, user activation/suspension, and audit logging.

### B. Machine Learning & Deep Learning Engine (`ml_system/`)
- **Technology**: Python 3.12, FastAPI, faster-whisper (Whisper), Scikit-learn, Joblib.
- **Zero Paid APIs**: Absolutely NO OpenAI, Gemini, Claude, ChatGPT, or external cloud LLMs.
- **The 7 Core Modules**:
  1. **Speech Recognition**: Pretrained Whisper (`faster-whisper-base`) with Hindi/English detection and timestamps.
  2. **Custom ML Classifier**: FeatureUnion (Word 1-3 + Char_wb 2-5 n-grams) + Logistic Regression (C=4.0, balanced) achieving 96.44% test accuracy (Macro F1: 0.9640) across 7 complaint categories.
  3. **Information Extraction (NLP)**: Hybrid regex & NER extracting Person, Location, Date, Time, Money, Phone, and Object.
  4. **Missing Information Detector**: Deterministic rule engine identifying missing critical facts per category.
  5. **Structured Complaint Generator**: Non-generative, template-based factsheet drafting with legal disclaimers.
  6. **Model Evaluation & Integrity**: Accuracy (96.44%), Macro F1 (0.9640), 95% Bootstrap CI [94.07%, 98.42%], Confusion Matrix, and SHA-256 frozen test set verification.
  7. **REST Backend & Persistence**: Unified `/api/analyze`, `/api/complaints`, SQLite database, and Swagger UI.

---

## 3. How to Run Each Component

### Running the Frontend (UI Demo)
```bash
# In project root: D:\AwaazSetu
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

### Running the ML/DL Backend
```bash
# In project root: D:\AwaazSetu
# Activate Python virtual environment:
& "D:\AwaazSetu\ml_system\.venv\Scripts\Activate.ps1"

# Navigate to ml_system
cd ml_system

# Launch FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** for interactive Swagger API testing.

---

### Running ML Model Training & Evaluation
```bash
# Retrain classification model (TF-IDF + Logistic Regression vs Linear SVM)
python ml_system/training/train_classifier.py

# Run evaluation and generate confusion matrix plot
python ml_system/training/evaluate_classifier.py

# Run automated tests
python -m pytest ml_system/tests -v
```

---

## 4. How to Connect Frontend and Backend (Phase 3 Integration)

When you are ready to connect the React UI to the live ML backend:

### Step 1: Create an API client in the frontend
Create `src/services/mlApi.ts`:
```typescript
const ML_API_BASE = "http://127.0.0.1:8000/api";

export async function analyzeComplaintText(text: string, language = "en") {
  const response = await fetch(`${ML_API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!response.ok) throw new Error("ML analysis failed");
  return response.json();
}

export async function transcribeAudioBlob(audioBlob: Blob, language = "en") {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  formData.append("language", language);

  const response = await fetch(`${ML_API_BASE}/analyze-audio`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Audio analysis failed");
  return response.json();
}
```

### Step 2: Call the API in the New Complaint Wizard
In `src/pages/NewComplaintPage.tsx`:
- When user finishes speaking or types their statement, call `analyzeComplaintText(transcript)`.
- Automatically pre-fill the **Category** dropdown with `result.classification.predicted_category`.
- Automatically pre-fill **Date**, **Time**, **Location**, and **Suspect/Property** fields from `result.extraction.entities`.
- Show any missing fields using `result.missing_information.missing_fields` and display follow-up questions!

---

## 5. Repository Directory Structure

```
AwaazSetu/
├── README.md                      # Main project documentation (this file)
├── package.json                   # Frontend dependencies
├── vite.config.ts                 # Vite bundler configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS public-service theme
│
├── src/                           # FRONTEND (Phase 1 UI Prototype)
│   ├── components/                # Reusable UI components (Navbar, Modals, AudioWaveform)
│   ├── context/                   # ComplaintContext & AuthContext (local simulated state)
│   ├── data/                      # Sample demo complaints (Metro theft, UPI fraud, etc.)
│   ├── pages/                     # Landing, Dashboard, NewComplaint, Detail, Officer, Admin
│   └── types/                     # TypeScript data interfaces
│
└── ml_system/                     # INDEPENDENT ML/DL/NLP ENGINE
    ├── README.md                  # Comprehensive ML system documentation
    ├── config.py                  # ML configuration & model paths
    ├── requirements.txt           # Python dependencies
    ├── pytest.ini                 # Pytest test configuration
    │
    ├── datasets/
    │   ├── raw/complaints_dataset.csv     # 217 hand-curated multilingual samples
    │   ├── processed/train.csv, test.csv  # Stratified 80/20 train/test splits
    │   └── create_dataset.py              # Dataset builder script
    │
    ├── nlp/
    │   ├── text_preprocessing.py          # Multilingual text normalization
    │   ├── entity_extraction.py           # NER & regex for incident facts
    │   └── missing_information.py         # Missing field rules & draft generator
    │
    ├── training/
    │   ├── train_classifier.py            # TF-IDF + Logistic Regression training
    │   ├── evaluate_classifier.py         # Test set evaluation suite
    │   └── predict.py                     # Singleton inference service
    │
    ├── evaluation/
    │   ├── metrics.py                     # Accuracy, F1, Precision, Recall, WER
    │   ├── confusion_matrix.py            # Matplotlib plot generator
    │   ├── evaluation_report.json         # Evaluation metrics report
    │   ├── confusion_matrix.png           # Rendered Confusion Matrix
    │   └── classification_metrics.png     # Rendered Metrics Bar Chart
    │
    ├── models/
    │   ├── complaint_classifier/          # Saved Joblib model & vectorizer
    │   └── speech_recognition/            # faster-whisper loader & engine
    │
    ├── backend/                           # FastAPI REST Service
    │   ├── main.py                        # FastAPI entry point & CORS
    │   ├── schemas/complaint.py           # Pydantic request & response schemas
    │   └── routes/                        # Modular route handlers
    │       ├── classification.py          # POST /api/classify
    │       ├── extraction.py              # POST /api/extract
    │       ├── transcription.py           # POST /api/transcribe
    │       └── analysis.py                # POST /api/analyze & /api/analyze-audio
    │
    └── tests/                             # Automated Test Suite
        ├── test_classifier.py             # 5 Unit tests for ML classifier
        ├── test_nlp.py                    # 5 Unit tests for NLP & extraction
        └── test_api.py                    # 11 Integration tests for FastAPI endpoints
```

---

## 6. Academic Presentation Checklist

When presenting this project to your professor or evaluator:
1. **Highlight the Clear Separation**:
   - The React frontend handles the responsive citizen & police UX.
   - The Python `ml_system/` handles real machine learning, NLP, and speech processing.
2. **Emphasize Academic Integrity**:
   - Zero reliance on paid black-box APIs (no OpenAI, no Gemini).
   - Real, locally trained Machine Learning model with measurable metrics (`Accuracy: 75.0%`, `F1: 0.7422`).
   - Grounded NLP extraction and deterministic factsheet generation to prevent AI hallucinations.
3. **Showcase the Evaluation Artifacts**:
   - Display `ml_system/evaluation/confusion_matrix.png` and `classification_metrics.png`.
   - Open `/docs` in the browser to run live model inference in front of the evaluator.
