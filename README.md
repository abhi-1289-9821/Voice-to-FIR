# AwaazSetu — Voice-Based Complaint Assistance and Case Tracking System
### Academic Project: Voice-to-FIR AI-Assisted Police Complaint and Case Management System

> **Academic Prototype & Legal Scope Disclaimer:**  
> AwaazSetu is an academic demonstration prototype designed to assist citizens in drafting complaints using spoken or typed statements and to assist police officers in triaging, reviewing, and organizing incident details.  
> **This prototype does not claim to register a legally valid First Information Report (FIR), does not make legal or judicial decisions, and does not replace an authorized police station house officer (SHO).** For actual emergency assistance, citizens must dial 112 directly.

---

## 1. Project Overview & Phase 1 Scope

This repository contains **Phase 1: Complete UI Prototype** for the project **“Voice-to-FIR: A Secure AI-Assisted Police Complaint and Case Management System”** (system name: **AwaazSetu**).

Phase 1 focuses **strictly on the complete frontend user experience**, visual flows, responsive interface design, and client-side simulation. It includes realistic mock scenarios (e.g., metro backpack theft, UPI phishing cyber fraud, vehicle theft, lost identity documents) and reactive local state so that the entire complaint lifecycle can be presented to your evaluator or teacher in a smooth, interactive demonstration.

### What is included in Phase 1:
- **Landing Page**: Plain-language system purpose, prominent legal limitation warning, entry points for citizens, police officers, and administrators, and an operational workflow diagram.
- **Sign-in & Registration Screen**: Polished multi-role access forms (Citizen, Officer, Admin) with instant 1-click persona switchers and client-side validation.
- **Citizen / Complainant Dashboard**: Overview cards with status counts, recent complaint cards with reference IDs (`AS-2026-XXXX`), search/filter tools, and presentation view mode toggles (Normal, Empty, Loading, and Error states).
- **New Complaint Wizard**: A 4-step guided intake wizard:
  1. *Voice Input & Audio Upload*: Realistic waveform animation, recording timer simulation, preset incident loader, and clear visual mockup notice.
  2. *Review & Edit Transcript*: Directly editable speech transcript allowing the user to correct simulated STT errors (demonstrating human-in-the-loop verification).
  3. *Incident Particulars Form*: Structured fields for incident summary, category, date, time, location, landmark, assigned police station, and complainant contact particulars with client-side required field validation.
  4. *Final Verification & Submit*: Complete case factsheet review, citizen truthfulness declaration checkbox, simulated reference token generation (`AS-2026-XXXX`), and instant addition to the local demo state.
- **Complaint Detail & Status Tracking Screen**: Printable receipt, interactive vertical status timeline (Submitted → Under Review → Needs Information → Closed), audio playback mockup, user-verified transcript viewer, and official officer note logs.
- **Police Officer Dashboard & Triage Console**: Searchable and filterable case queue with status tabs (Pending Review, Under Review, Needs Information, Closed), side-by-side incident factsheet and speech transcript, mock audio player, interactive status dropdown, and canned police note presets that update the local case record immediately.
- **Administrator Console**: System diagnostics counters, user table with role assignments, simulated account suspend/activate actions and role changes backed by confirmation modal dialogs, and a chronological system activity audit log.
- **Shared Navigation & Presentation Tools**: Fixed disclaimer banner, responsive navigation header, quick persona dropdown, persistent toast notifications, and a 1-click **Reset Demo Data** tool to restore initial sample states at any time.

---

## 2. Technology Stack

### Phase 1 Implementation Stack:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS with custom public-service color schemes (`police` navy tones, `amber` alerts, accessible high-contrast text)
- **Icons**: Lucide React
- **Client State**: React Context API with LocalStorage caching for session persistence

### Planned Stack for Later Phases:
- **Browser Audio Recording**: MediaRecorder API *(Phase 2)*
- **Backend Service**: Python & FastAPI *(Phase 3)*
- **Speech Recognition Engine**: Whisper via `faster-whisper` *(Phase 3)*
- **Audio Pre-processing**: FFmpeg *(Phase 3)*
- **Database & Migrations**: PostgreSQL, SQLAlchemy ORM, Alembic *(Phase 5)*
- **Authentication & Security**: Role-Based Access Control (RBAC) with JWT *(Phase 5)*
- **Deployment & Packaging**: Docker & Docker Compose *(Phase 7)*

---

## 3. How to Run the Frontend Locally

### Prerequisites:
- Node.js (v18 or higher recommended; developed and tested on Node.js v24)
- npm (comes with Node.js)

### Steps to Run:
1. **Clone or navigate to the project directory:**
   ```bash
   cd D:\AwaazSetu
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```
   *The console will display the local development URL, typically `http://localhost:5173/`.*

4. **Open in browser:**
   Navigate to [http://localhost:5173/](http://localhost:5173/) to interact with the full presentation demo.

5. **(Optional) Build production bundle:**
   ```bash
   npm run build
   ```
   To preview the optimized production build:
   ```bash
   npm run preview
   ```

---

## 4. What is Mocked vs. What is Still Unimplemented

To ensure academic honesty during project evaluation, here is the explicit breakdown of Phase 1:

| Feature Area | Current State in Phase 1 (UI Prototype) | Unimplemented / Future Phase |
| :--- | :--- | :--- |
| **User Interface & Flows** | **Fully Built**: All 7 screens, dialogs, forms, badges, and responsive layouts. | None (all Phase 1 UI requirements complete). |
| **Authentication** | **Mocked**: 1-click persona switching (Citizen, Officer, Admin) and mock form validation. | Real password hashing, JWT tokens, refresh tokens, and session cookies (*Phase 5*). |
| **Data Storage** | **Mocked**: Client-side memory and browser `localStorage`. Changes persist in session and can be reset with one click. | Real PostgreSQL database, SQLAlchemy models, and Alembic migrations (*Phase 5*). |
| **Microphone / Audio** | **Mocked**: Visual timer, animated waveform, and preset audio scenario loader. | Real browser `MediaRecorder` API and blob serialization (*Phase 2*). |
| **Speech Recognition** | **Mocked**: Pre-loaded simulated transcripts with client-side editing interface. | Python FastAPI backend running `faster-whisper` (*Phase 3*). |
| **Officer Actions** | **Mocked**: Status updates and note additions write to client demo state. | Backend database updates, audit logs, and push notifications (*Phase 6*). |
| **Legal Validity** | **Explicitly Non-Legal**: Complaints are drafts for officer review. | Legal FIR registration requires authorized officer sign-off under statutory law (*Not replaced by AI*). |

---

## 5. Phase-by-Phase Roadmap for Later Work

The project follows a structured 7-phase roadmap:

- **Phase 1 (Completed)**: Complete UI Prototype (React, TypeScript, Vite, Tailwind CSS, mock data, role switching).
- **Phase 2 — Audio Recording and Upload**: Connect browser microphone recording via `MediaRecorder` API, WAV/MP3 file upload dropzones, audio playback of actual recorded user clips, and file format validation.
- **Phase 3 — Backend and Speech Recognition**: Set up FastAPI service, handle multipart audio uploads, configure FFmpeg for audio resampling, and integrate Whisper models through `faster-whisper` for multilingual transcription.
- **Phase 4 — Transcript Correction and Complaint Submission**: Link real model transcripts into the review/editing step, compute phonetic similarity/diffs, and implement draft complaint saving and submission APIs.
- **Phase 5 — Database and Authentication**: Design PostgreSQL schemas (Users, Complaints, Transcripts, TimelineEvents, AuditLogs), implement SQLAlchemy models and Alembic migrations, and add JWT authentication with Role-Based Access Control (Complainant, Police Officer, Administrator).
- **Phase 6 — Officer and Administrator Workflows**: Connect officer triage dashboards to backend REST endpoints, implement official review note additions, status transitions with role guards, citizen notification webhooks/SMS mock, and immutable admin audit trails.
- **Phase 7 — Security, Evaluation, and Presentation**: Conduct security review (input sanitization, PII masking, rate limiting), evaluate speech transcription accuracy across diverse accents/noise conditions using Word Error Rate (WER) on consented recordings, and prepare final Docker Compose deployment.

---

## 6. Guide for Presenting to Evaluators / Teachers

When demonstrating AwaazSetu to your teacher:
1. **Landing Page**: Highlight the clear public-service aesthetic, plain-language explanation, and prominent **Non-Legal FIR Disclaimer**.
2. **Citizen Workflow**:
   - Click **"File a Complaint"** to enter the 4-step wizard.
   - On Step 1, select a sample preset (e.g. *Metro Backpack Theft*) and demonstrate the mock voice recording waveform.
   - On Step 2, show how the transcript is **directly editable** so complainants can correct any misheard terms (e.g., brand names, serial numbers, landmarks).
   - On Step 3, show structured incident fields and client-side validation.
   - On Step 4, tick the declaration and submit. Show the generated reference number (`AS-2026-XXXX`).
3. **Citizen Dashboard**:
   - Click the **View States** buttons (*Empty State*, *Loading State*, *Error State*) to demonstrate robust UI state handling.
   - Click the submitted complaint card to view the **Case Tracking Timeline**.
4. **Police Officer Portal**:
   - Use the top navigation role switcher to select **SI Rajesh Kumar (Police Officer)**.
   - Filter complaints by status (e.g., *Pending Review*).
   - Open the newly submitted complaint, listen to the mock audio player, select *Under Review*, click a canned note (*"CCTV footage requested"*), and commit the update.
   - Switch back to the Citizen portal to demonstrate that the status change immediately reflected in the citizen's case timeline!
5. **Admin Console**:
   - Switch to **System Admin**. Show user role management, account suspension with confirmation modal, and the live activity audit log.
   - Click **Reset Demo State** to cleanly restore all initial sample records.

