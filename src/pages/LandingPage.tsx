import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Mic,
  BadgeAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActivePage, loginAsRole, setSelectedComplaintId } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-police-950 via-police-900 to-police-800 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-police-700">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94bfe0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Project Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-police-800/80 border border-police-700 text-amber-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Academic Prototype — Phase 1 UI Demonstration</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              AwaazSetu
            </h1>
            <p className="text-lg sm:text-xl font-medium text-amber-400 mt-2">
              Voice-Based Complaint Assistance and Case Tracking System
            </p>
            <p className="text-sm font-normal text-slate-400 mt-1 font-mono">
              Academic Project: Voice-to-FIR AI-Assisted Intake System
            </p>

            <p className="mt-5 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">
              Bridging the gap between citizens and law enforcement. AwaazSetu enables citizens to describe 
              grievances in spoken voice, review AI-assisted transcripts, and submit structured incident reports 
              for authorized police verification and case tracking.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  loginAsRole('complainant');
                  setActivePage('new-complaint');
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-police-950 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
              >
                <Mic className="w-5 h-5 text-police-950" />
                <span>File a Complaint (Voice / Text)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => {
                  loginAsRole('officer');
                  setActivePage('officer-dashboard');
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-police-800/90 hover:bg-police-700 text-white font-semibold rounded-xl border border-police-600 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <BadgeAlert className="w-5 h-5 text-blue-400" />
                <span>Police Officer Portal</span>
              </button>
            </div>

            {/* Quick Demo Shortcuts */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400">Quick Demo Access:</span>
              <button
                onClick={() => {
                  loginAsRole('complainant');
                  setActivePage('complainant-dashboard');
                }}
                className="underline hover:text-amber-300 transition-colors"
              >
                Citizen Dashboard
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setSelectedComplaintId('c-001');
                  setActivePage('complaint-detail');
                }}
                className="underline hover:text-amber-300 transition-colors"
              >
                Case Tracking Screen
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  loginAsRole('admin');
                  setActivePage('admin-dashboard');
                }}
                className="underline hover:text-amber-300 transition-colors"
              >
                Admin & Audit Console
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Legal Disclaimer Card */}
      <section className="max-w-5xl mx-auto -mt-8 px-4 relative z-20">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-800 flex-shrink-0">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
              Prototype Scope & Legal Limitation Notice
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              <strong>AwaazSetu is an academic prototype</strong> designed to assist complainants in drafting structured incident narratives 
              and to help officers organize and prioritize complaint review. 
              <strong> It does not claim to register a legally valid First Information Report (FIR)</strong> under the Code of Criminal Procedure, 
              does not make judicial determinations, and does not replace an authorized station house officer (SHO).
            </p>
          </div>
          <div className="flex-shrink-0 self-end md:self-center">
            <span className="inline-block px-3 py-1.5 bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold">
              Officer Review Required
            </span>
          </div>
        </div>
      </section>

      {/* Three Entry Points Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            System Entry Points
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Choose the interface persona to evaluate the role-specific workflows built in this Phase 1 prototype.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Complainant */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
                For Citizens
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                Citizen Grievance Intake
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Record or type incident statements, inspect editable speech transcripts, fill structured facts, 
                and receive a demo reference tracking ID.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Interactive 4-step complaint wizard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Editable transcript to correct speech errors</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Real-time status tracking timeline</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  loginAsRole('complainant');
                  setActivePage('complainant-dashboard');
                }}
                className="w-full py-2.5 px-4 bg-police-800 hover:bg-police-900 text-white font-medium text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <span>Enter as Complainant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Police Officer */}
          <div className="bg-white rounded-2xl border-2 border-police-200 shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-police-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Police Operations
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-police-100 text-police-700 flex items-center justify-center mb-4">
                <BadgeAlert className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider bg-police-50 px-2 py-0.5 rounded">
                For Station Officers
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                Officer Triage Console
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Filter and examine incoming complaints, compare citizen voice records against structured details, 
                and update triage status with official notes.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Searchable triage board with status filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Mock audio player with synced transcript</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Interactive status updater & official note logs</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  loginAsRole('officer');
                  setActivePage('officer-dashboard');
                }}
                className="w-full py-2.5 px-4 bg-police-600 hover:bg-police-700 text-white font-medium text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Enter Police Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Administrator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">
                Administration
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                Platform Admin & Audit
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Manage user role assignments, toggle account permissions with confirmation dialogs, 
                and inspect system-wide activity audit events.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Manage users (Citizen, Officer, Admin)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Simulated account suspend/activate controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Full system activity audit logs</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  loginAsRole('admin');
                  setActivePage('admin-dashboard');
                }}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How the Planned System Works (Visual Workflow) */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-police-600 tracking-wider uppercase">
              Operational Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              End-to-End Voice-to-FIR Workflow
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              How spoken statements transition safely from citizen narration into validated police case records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-police-100 text-police-700 font-bold text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Spoken Intake</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Complainant speaks in natural everyday language. Audio is captured via browser or uploaded directly.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Transcription & Edit</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Audio is transcribed. Complainant inspects and edits any phonetic errors to ensure true representation.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Officer Triage</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Investigating officer reviews the audio transcript, checks station jurisdiction, and sets status notes.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Legal FIR Decision</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Authorized station officer registers legal FIR or Non-Cognizable Report according to statutory police guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planned Roadmap Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-police-600 uppercase tracking-wider">
            Development Plan
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Planned Stack & Implementation Phases
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Phase 1 delivers the full frontend user interface. Subsequent phases will integrate the audio pipeline, 
            Whisper transcription, FastAPI backend, and PostgreSQL database.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Phase 1 (Active)
            </span>
            <p className="font-bold text-slate-900 text-sm mt-2">UI Prototype</p>
            <p className="text-[11px] text-slate-500 mt-1">React, TypeScript, Vite & Tailwind</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Phase 2 (Upcoming)
            </span>
            <p className="font-bold text-slate-900 text-sm mt-2">Audio Recording</p>
            <p className="text-[11px] text-slate-500 mt-1">MediaRecorder API & Audio Upload</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Phase 3 (Upcoming)
            </span>
            <p className="font-bold text-slate-900 text-sm mt-2">Speech Recognition</p>
            <p className="text-[11px] text-slate-500 mt-1">FastAPI & faster-whisper STT</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Phases 4–7
            </span>
            <p className="font-bold text-slate-900 text-sm mt-2">DB & Security</p>
            <p className="text-[11px] text-slate-500 mt-1">PostgreSQL, JWT Auth & Docker</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-police-950 text-slate-400 py-10 border-t border-police-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-slate-200 font-bold">AwaazSetu</span>
            <span>— Voice-to-FIR Academic Prototype</span>
          </div>
          <p className="text-center md:text-right text-slate-500">
            Designed for College Project Academic Review. Not for operational emergency reporting.
          </p>
        </div>
      </footer>
    </div>
  );
};
