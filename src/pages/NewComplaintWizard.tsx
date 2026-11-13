import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';
import { SAMPLE_AUDIO_PRESETS } from '../data/mockData';
import { ComplaintCategory, ComplaintPriority } from '../types';

export const NewComplaintWizard: React.FC = () => {
  const { addComplaint, setActivePage, setSelectedComplaintId } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Voice Input / Upload (Mockup state)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [isSimulatingRecording, setIsSimulatingRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [mockFileName, setMockFileName] = useState<string>('complaint_voice_recording.wav');

  // Step 2: Transcript & Corrections
  const [rawTranscript, setRawTranscript] = useState<string>(
    SAMPLE_AUDIO_PRESETS[0].sampleTranscript
  );
  const [editedTranscript, setEditedTranscript] = useState<string>(
    SAMPLE_AUDIO_PRESETS[0].sampleTranscript
  );
  const [hasEditedTranscript, setHasEditedTranscript] = useState<boolean>(false);

  // Step 3: Structured Incident Form
  const [incidentCategory, setIncidentCategory] = useState<ComplaintCategory>(
    'Theft / Stolen Property'
  );
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [incidentTime, setIncidentTime] = useState<string>('18:30');
  const [incidentLocation, setIncidentLocation] = useState<string>(
    'Indiranagar Metro Station Exit B, Bengaluru'
  );
  const [incidentLandmark, setIncidentLandmark] = useState<string>(
    'Near Ticket Counter Kiosk 2'
  );
  const [incidentDescription, setIncidentDescription] = useState<string>(
    'Black Wildcraft backpack with Lenovo ThinkPad laptop, charger, and access pass was stolen while recharging metro card.'
  );
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [policeStation, setPoliceStation] = useState<string>(
    'Indiranagar Police Station, Bengaluru'
  );

  // Complainant particulars
  const [complainantName, setComplainantName] = useState<string>('Rohan Sharma');
  const [complainantPhone, setComplainantPhone] = useState<string>('+91 98765 43210');
  const [complainantEmail, setComplainantEmail] = useState<string>(
    'rohan.sharma.demo@example.com'
  );
  const [complainantAddress, setComplainantAddress] = useState<string>(
    '#42, 3rd Cross, 1st Stage, Indiranagar, Bengaluru - 560038'
  );

  // Step 4: Submission declaration & Confirmation
  const [declarationChecked, setDeclarationChecked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Timer simulation for voice recording
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isSimulatingRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 42) {
            setIsSimulatingRecording(false);
            return 42;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulatingRecording]);

  const handleApplyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = SAMPLE_AUDIO_PRESETS[index];
    setRawTranscript(preset.sampleTranscript);
    setEditedTranscript(preset.sampleTranscript);
    setHasEditedTranscript(false);
    setIncidentCategory(preset.category);
    setIncidentLocation(preset.location);
    setIncidentDescription(preset.sampleTranscript.slice(0, 160) + '...');
    setMockFileName(`preset_recording_${index + 1}.wav`);
    setRecordingSeconds(parseInt(preset.duration.split(':')[1], 10));
  };

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTranscript(e.target.value);
    setHasEditedTranscript(true);
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!incidentDescription.trim()) {
      errs.incidentDescription = 'Please provide a clear description of the incident.';
    }
    if (!incidentDate.trim()) {
      errs.incidentDate = 'Incident date is required.';
    }
    if (!incidentTime.trim()) {
      errs.incidentTime = 'Incident approximate time is required.';
    }
    if (!incidentLocation.trim()) {
      errs.incidentLocation = 'Incident location / police jurisdiction area is required.';
    }
    if (!complainantName.trim()) {
      errs.complainantName = 'Full legal name is required.';
    }
    if (!complainantPhone.trim()) {
      errs.complainantPhone = 'Contact phone number is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) {
        setCurrentStep(4);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = () => {
    if (!declarationChecked) {
      setErrors({ declaration: 'You must acknowledge the verification declaration.' });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedRef = `AS-2026-0${Math.floor(500 + Math.random() * 499)}`;

      const newCase = addComplaint({
        referenceNumber: generatedRef,
        complainantName,
        complainantPhone,
        complainantEmail,
        complainantAddress,
        incidentCategory,
        incidentDate,
        incidentTime,
        incidentLocation,
        incidentLandmark,
        description: incidentDescription,
        rawTranscript: editedTranscript,
        isTranscriptEdited: hasEditedTranscript,
        status: 'Pending Review',
        priority,
        policeStation,
        mockAudioLengthSeconds: recordingSeconds || 42,
      });

      setSubmittedReference(generatedRef);
      setSelectedComplaintId(newCase.id);
      setIsSubmitting(false);
    }, 1000);
  };

  // If already submitted, display confirmation screen
  if (submittedReference) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold mb-2">
            Simulated Prototype Submission
          </span>

          <h2 className="text-2xl font-bold text-slate-900">
            Complaint Lodged for Review
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Your statement and incident details have been registered into the station triage queue. 
            An assigned officer will review the transcript and verify jurisdiction.
          </p>

          {/* Reference Number Box */}
          <div className="my-6 p-6 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Complaint Reference Number
            </p>
            <p className="text-3xl font-mono font-extrabold text-police-900 mt-1 tracking-wide">
              {submittedReference}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Status: Pending Review</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Station Jurisdiction: <strong>{policeStation}</strong>
            </p>
          </div>

          {/* Prototype Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 max-w-lg mx-auto text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Academic Demonstration Notice:</strong> In this Phase 1 prototype, this record has been added to 
              local browser state. You can immediately inspect it in both the <strong>Citizen Dashboard</strong> and the 
              <strong>Police Officer Console</strong>.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActivePage('complaint-detail')}
              className="w-full sm:w-auto px-6 py-3 bg-police-800 hover:bg-police-900 text-white font-semibold text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <span>Track Case & View Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('complainant-dashboard')}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm rounded-xl transition-all"
            >
              Return to Citizen Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Wizard Header & Progress Bar */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Lodge New Incident Complaint
            </h1>
            <p className="text-xs text-slate-500">
              Follow the 4 steps to dictate, review, structure, and lodge your complaint for police review.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-police-50 text-police-700 border border-police-200 rounded-full self-start sm:self-center">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Voice Input / Audio' },
            { num: 2, label: 'Review Transcript' },
            { num: 3, label: 'Incident Details' },
            { num: 4, label: 'Verify & Submit' },
          ].map((s) => (
            <div
              key={s.num}
              className={`pb-2 border-b-2 text-center transition-colors ${
                currentStep === s.num
                  ? 'border-police-600 text-police-900 font-bold'
                  : currentStep > s.num
                  ? 'border-emerald-500 text-emerald-700 font-medium'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider hidden sm:block">
                Step {s.num}
              </div>
              <div className="text-xs truncate">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Voice Input & Mock Audio Upload */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Explicit Mockup Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Phase 1 Visual Mockup Notice:</strong> Browser microphone access (MediaRecorder) and 
              speech recognition (faster-whisper) are scheduled for Phases 2 & 3. 
              Below are realistic visual mockups and sample incident presets to demonstrate the planned interface.
            </div>
          </div>

          {/* Preset Picker for Quick Presentation Demo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Presentation Audio Preset:
              </span>
              <span className="text-[11px] text-slate-500">1-click demo loader</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_AUDIO_PRESETS.map((preset, idx) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleApplyPreset(idx)}
                  className={`p-3 text-left rounded-lg border text-xs transition-all ${
                    selectedPresetIndex === idx
                      ? 'border-police-600 bg-police-50/70 font-semibold text-police-900 ring-1 ring-police-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="font-semibold truncate">{preset.title.split(':')[1]}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Duration: {preset.duration}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Recording Panel (Visual Mockup) */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-police-900 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Mic className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                Spoken Incident Dictation (Mockup)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Speak clearly in Kannada, Hindi, or English to record incident particulars.
              </p>

              {/* Waveform Simulation */}
              <div className="my-5 flex items-center justify-center gap-1.5 h-10">
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-1' : 'h-3'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-2' : 'h-6'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-3' : 'h-4'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-4' : 'h-7'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-5' : 'h-5'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-2' : 'h-8'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full ${isSimulatingRecording ? 'animate-wave-1' : 'h-4'}`} />
              </div>

              {/* Timer & Controls */}
              <div className="font-mono text-lg font-bold text-slate-800 mb-4">
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:42
              </div>

              <div className="flex items-center justify-center gap-3">
                {!isSimulatingRecording ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulatingRecording(true);
                      setRecordingSeconds(0);
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Simulate Audio Recording</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSimulatingRecording(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow flex items-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setRecordingSeconds(0)}
                  className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl"
                  title="Reset recording timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Audio File Upload Panel (Visual Mockup) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Audio Upload Panel (Mockup)
                </p>
                <p className="text-[11px] text-slate-500">
                  Mock loaded file: <span className="font-mono text-slate-700">{mockFileName}</span> (42s, WAV)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Demo notice: Audio upload selection will be hooked up to backend in Phase 2.')}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
            >
              Choose Audio File...
            </button>
          </div>

          {/* Navigation Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-police-800 hover:bg-police-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2"
            >
              <span>Continue to Transcript Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Review & Edit Transcript */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Speech-to-Text Transcript Inspection
              </h3>
              <p className="text-xs text-slate-500">
                Inspect the transcribed text below. Complainants have the right to edit and correct any speech recognition discrepancies before submitting.
              </p>
            </div>
            {hasEditedTranscript && (
              <span className="self-start sm:self-center px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium">
                Edited by Complainant
              </span>
            )}
          </div>

          {/* Correction Tip */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Teacher Demo Highlight:</strong> Whisper speech recognition may occasionally mishear names, brand models, or Indian landmarks. 
              Click inside the box below to edit words or replace terms (e.g. typing specific serial numbers or street names).
            </span>
          </div>

          {/* Editable Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Transcript Text (Directly Editable)
            </label>
            <textarea
              rows={6}
              value={editedTranscript}
              onChange={handleTranscriptChange}
              className="w-full p-4 text-xs sm:text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-police-500 focus:outline-none font-sans leading-relaxed"
              placeholder="Spoken transcript will appear here for review..."
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Word count: {editedTranscript.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button
                type="button"
                onClick={() => {
                  setEditedTranscript(rawTranscript);
                  setHasEditedTranscript(false);
                }}
                className="text-police-700 hover:underline"
              >
                Reset to Original Speech Transcript
              </button>
            </div>
          </div>

          {/* Original vs Edited Comparison */}
          {hasEditedTranscript && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <p className="font-semibold text-slate-700 mb-1">Original Automated Recognition:</p>
              <p className="text-slate-500 italic font-mono text-[11px]">{rawTranscript}</p>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-police-800 hover:bg-police-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2"
            >
              <span>Proceed to Incident Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Structured Incident Details Form */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Structured Incident Particulars
            </h3>
            <p className="text-xs text-slate-500">
              Provide necessary date, jurisdiction, and contact particulars for the station house officer's review.
            </p>
          </div>

          {/* Incident Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Category *
              </label>
              <select
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              >
                <option value="Theft / Stolen Property">Theft / Stolen Property</option>
                <option value="Cybercrime / Online Fraud">Cybercrime / Online Fraud</option>
                <option value="Physical Assault / Harassment">Physical Assault / Harassment</option>
                <option value="Financial Fraud / Cheating">Financial Fraud / Cheating</option>
                <option value="Vehicle Theft / Traffic Incident">Vehicle Theft / Traffic Incident</option>
                <option value="Public Nuisance & Disturbance">Public Nuisance & Disturbance</option>
                <option value="Lost & Found">Lost & Found</option>
                <option value="Other Grievance">Other Grievance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Triage Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              >
                <option value="Low">Low (Informational / Lost Document)</option>
                <option value="Medium">Medium (Standard Investigation)</option>
                <option value="High">High (Substantial Financial/Property Loss)</option>
                <option value="Emergency">Emergency (Immediate Officer Dispatch Required)</option>
              </select>
            </div>
          </div>

          {/* Incident Date, Time & Police Station */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Incident *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
                />
              </div>
              {errors.incidentDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.incidentDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approximate Time *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="time"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
                />
              </div>
              {errors.incidentTime && (
                <p className="text-[11px] text-red-600 mt-1">{errors.incidentTime}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurisdiction Station *
              </label>
              <input
                type="text"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                placeholder="e.g. Indiranagar Police Station"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Location *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="Street, Metro Station, or cyber portal"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
                />
              </div>
              {errors.incidentLocation && (
                <p className="text-[11px] text-red-600 mt-1">{errors.incidentLocation}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nearest Landmark (Optional)
              </label>
              <input
                type="text"
                value={incidentLandmark}
                onChange={(e) => setIncidentLandmark(e.target.value)}
                placeholder="e.g. Opp Coffee Day Kiosk"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Formal Incident Summary / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Summary & Stolen / Involved Items *
            </label>
            <textarea
              rows={3}
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              placeholder="Concise summary for police log..."
              className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none leading-relaxed"
            />
            {errors.incidentDescription && (
              <p className="text-[11px] text-red-600 mt-1">{errors.incidentDescription}</p>
            )}
          </div>

          {/* Complainant Contact Details */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Complainant Legal Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                {errors.complainantName && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.complainantName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={complainantPhone}
                    onChange={(e) => setComplainantPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                {errors.complainantPhone && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.complainantPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={complainantEmail}
                    onChange={(e) => setComplainantEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs text-slate-600 mb-1">Residential Address</label>
              <input
                type="text"
                value={complainantAddress}
                onChange={(e) => setComplainantAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-police-800 hover:bg-police-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2"
            >
              <span>Review Complete Filing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Final Verification & Submission
            </h3>
            <p className="text-xs text-slate-500">
              Review all details before generating your complaint reference token.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Incident Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Incident Particulars
              </p>
              <div>
                <span className="text-slate-500">Category:</span>{' '}
                <span className="font-semibold text-slate-800">{incidentCategory}</span>
              </div>
              <div>
                <span className="text-slate-500">When:</span>{' '}
                <span className="font-semibold text-slate-800">{incidentDate} at {incidentTime}</span>
              </div>
              <div>
                <span className="text-slate-500">Where:</span>{' '}
                <span className="font-semibold text-slate-800">{incidentLocation}</span>
                {incidentLandmark && <span className="text-slate-500"> ({incidentLandmark})</span>}
              </div>
              <div>
                <span className="text-slate-500">Assigned Station:</span>{' '}
                <span className="font-semibold text-slate-800">{policeStation}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-0.5">Summary:</span>
                <p className="text-slate-800 font-medium leading-relaxed">{incidentDescription}</p>
              </div>
            </div>

            {/* Complainant Particulars */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Complainant Particulars
              </p>
              <div>
                <span className="text-slate-500">Name:</span>{' '}
                <span className="font-semibold text-slate-800">{complainantName}</span>
              </div>
              <div>
                <span className="text-slate-500">Contact:</span>{' '}
                <span className="font-semibold text-slate-800">{complainantPhone}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{' '}
                <span className="font-semibold text-slate-800">{complainantEmail}</span>
              </div>
              <div>
                <span className="text-slate-500">Address:</span>{' '}
                <span className="font-semibold text-slate-800">{complainantAddress}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500">Audio Record:</span>{' '}
                <span className="font-mono text-slate-700">{mockFileName} (Duration: 00:42)</span>
              </div>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Attached Verified Transcript
              </p>
              {hasEditedTranscript && (
                <span className="text-[10px] text-amber-700 font-medium">User Corrected</span>
              )}
            </div>
            <p className="text-slate-700 italic leading-relaxed">{editedTranscript}</p>
          </div>

          {/* Verification Declaration */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => {
                  setDeclarationChecked(e.target.checked);
                  if (errors.declaration) setErrors({});
                }}
                className="w-4 h-4 mt-0.5 rounded text-police-700 focus:ring-police-500"
              />
              <span className="text-xs text-amber-950 leading-relaxed">
                <strong>Citizen Declaration:</strong> I state that the facts narrated in this complaint draft are true to the best of my knowledge. 
                I understand this submission is an AI-assisted intake for police review and does not automatically constitute a legally registered FIR.
              </span>
            </label>
            {errors.declaration && (
              <p className="text-[11px] text-red-600 font-semibold">{errors.declaration}</p>
            )}
          </div>

          {/* Navigation Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-police-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-police-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Station Queue...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-police-950" />
                  <span>Submit Complaint for Officer Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
