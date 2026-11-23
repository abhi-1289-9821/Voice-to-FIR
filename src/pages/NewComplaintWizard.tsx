import React, { useState, useRef, useEffect } from 'react';
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
  Square,
  RotateCcw,
  AlertTriangle,
  Brain,
  Tag,
} from 'lucide-react';
import { SAMPLE_AUDIO_PRESETS } from '../data/mockData';
import { ComplaintCategory, ComplaintPriority } from '../types';
import {
  mlApi,
  mapBackendCategoryToFrontend,
  AnalysisResponse,
  AudioAnalysisResponse,
} from '../services/mlApi';

export const NewComplaintWizard: React.FC = () => {
  const { addComplaint, setActivePage, setSelectedComplaintId, addToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // ==========================================
  // Real Audio Recording State (MediaRecorder API)
  // ==========================================
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('complaint_recording.wav');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Audio Processing State
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [audioProcessingMessage, setAudioProcessingMessage] = useState<string>('');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [whisperProcessingTime, setWhisperProcessingTime] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preset Selection for Presentation Demo
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // ==========================================
  // Step 2: Transcript & Corrections
  // ==========================================
  const [rawTranscript, setRawTranscript] = useState<string>(
    SAMPLE_AUDIO_PRESETS[0].sampleTranscript
  );
  const [editedTranscript, setEditedTranscript] = useState<string>(
    SAMPLE_AUDIO_PRESETS[0].sampleTranscript
  );
  const [hasEditedTranscript, setHasEditedTranscript] = useState<boolean>(false);
  const [isAnalyzingTranscript, setIsAnalyzingTranscript] = useState<boolean>(false);

  // ==========================================
  // ML Classification & NLP Extraction State
  // ==========================================
  const [mlPredictedCategory, setMlPredictedCategory] = useState<string | null>(null);
  const [mlConfidence, setMlConfidence] = useState<number | null>(null);
  const [mlProbabilities, setMlProbabilities] = useState<Record<string, number>>({});
  const [mlModelName, setMlModelName] = useState<string>('TFIDF_LogisticRegression');
  const [extractedEntities, setExtractedEntities] = useState<Record<string, string[]>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [nlpPreFilledFields, setNlpPreFilledFields] = useState<Record<string, boolean>>({});

  // ==========================================
  // Step 3: Structured Incident Form
  // ==========================================
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

  // Complainant Particulars
  const [complainantName, setComplainantName] = useState<string>('Rohan Sharma');
  const [complainantPhone, setComplainantPhone] = useState<string>('+91 98765 43210');
  const [complainantEmail, setComplainantEmail] = useState<string>(
    'rohan.sharma.demo@example.com'
  );
  const [complainantAddress, setComplainantAddress] = useState<string>(
    '#42, 3rd Cross, 1st Stage, Indiranagar, Bengaluru - 560038'
  );

  // ==========================================
  // Step 4: Submission & Confirmation
  // ==========================================
  const [declarationChecked, setDeclarationChecked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [isBackendSaved, setIsBackendSaved] = useState<boolean>(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [recordedAudioUrl]);

  // ==========================================
  // Real MediaRecorder Audio Recording Functions
  // ==========================================

  const startRealRecording = async () => {
    setAudioError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError('Browser does not support audio recording. Please use modern Chrome/Edge/Firefox.');
      addToast('Recording Error', 'Microphone recording not supported on this browser.', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine best supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        setRecordedAudioBlob(audioBlob);
        setAudioFileName(`voice_recording_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        // Automatically transcribe with faster-whisper
        transcribeAndAnalyzeAudioBlob(audioBlob);
      };

      mediaRecorder.start(250); // collect 250ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      addToast('Recording Started', 'Speak clearly into your microphone.', 'info');
    } catch (err: any) {
      console.error('Microphone error:', err);
      let msg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone device found on your computer.';
      }
      setAudioError(msg);
      addToast('Microphone Blocked', msg, 'error');
    }
  };

  const stopRealRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      addToast('Recording Stopped', 'Sending audio to faster-whisper for transcription...', 'info');
    }
  };

  const resetRecording = () => {
    if (isRecording) {
      stopRealRecording();
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setAudioError(null);
  };

  // ==========================================
  // Audio Transcription & Analysis Pipeline
  // ==========================================

  const applyAnalysisResult = (analysis: AnalysisResponse) => {
    // 1. Classification
    const cls = analysis.classification;
    setMlPredictedCategory(cls.predicted_category);
    setMlConfidence(cls.confidence);
    setMlProbabilities(cls.class_probabilities || {});
    setMlModelName(cls.model_name || 'TFIDF_LogisticRegression');

    // Pre-select mapped category
    const mapped = mapBackendCategoryToFrontend(cls.predicted_category);
    setIncidentCategory(mapped);

    // 2. Extraction & Auto-fill
    const ext = analysis.extraction.extracted_entities || {};
    setExtractedEntities(ext);

    const filledTracker: Record<string, boolean> = {};

    if (ext.LOCATION && ext.LOCATION.length > 0) {
      setIncidentLocation(ext.LOCATION[0]);
      filledTracker.location = true;
    }
    if (ext.DATE && ext.DATE.length > 0) {
      filledTracker.date = true;
    }
    if (ext.TIME && ext.TIME.length > 0) {
      filledTracker.time = true;
    }

    // 3. Missing Information
    if (analysis.missing_information) {
      setMissingFields(analysis.missing_information.missing_fields || []);
      setFollowUpQuestions(analysis.missing_information.follow_up_questions || []);
    }

    // 4. Structured Factsheet
    if (analysis.structured_complaint) {
      setIncidentDescription(analysis.structured_complaint.incident_summary);
    }

    setNlpPreFilledFields(filledTracker);
  };

  const transcribeAndAnalyzeAudioBlob = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    setAudioProcessingMessage('Transcribing speech with faster-whisper...');
    setAudioError(null);

    try {
      const resp: AudioAnalysisResponse = await mlApi.analyzeAudio(
        audioBlob,
        selectedLanguage,
        complainantName,
        complainantPhone
      );

      const trans = resp.transcription;
      if (trans.transcript && trans.transcript.trim()) {
        setRawTranscript(trans.transcript);
        setEditedTranscript(trans.transcript);
        setHasEditedTranscript(false);
        setDetectedLanguage(trans.detected_language || selectedLanguage);
        setWhisperProcessingTime(trans.processing_time);

        if (resp.analysis) {
          applyAnalysisResult(resp.analysis);
        }

        addToast(
          'Transcription Complete',
          `Transcribed in ${trans.processing_time}s (${trans.detected_language?.toUpperCase() || 'EN'}).`,
          'success'
        );
        setCurrentStep(2);
      } else {
        // Fallback diagnostic status from backend (e.g. if audio was silent)
        if (trans.status === 'runtime_policy_blocked' || trans.error_message) {
          setAudioError(trans.error_message || 'Whisper diagnostic report received.');
        } else {
          setAudioError('No spoken words detected in audio. Please speak clearly or choose a sample preset.');
        }
      }
    } catch (err: any) {
      console.warn('Backend audio analysis error:', err);
      setAudioError(err.message || 'Audio transcription failed. Ensure ML Backend is running.');
      addToast('Backend Notice', 'ML Backend offline or busy. Using offline preset data.', 'warning');
    } finally {
      setIsProcessingAudio(false);
      setAudioProcessingMessage('');
    }
  };

  const handleManualAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setAudioError('File size exceeds 25 MB limit.');
      addToast('File Too Large', 'Maximum audio file size is 25 MB.', 'error');
      return;
    }

    setAudioFileName(file.name);
    setRecordedAudioBlob(file);
    const url = URL.createObjectURL(file);
    setRecordedAudioUrl(url);

    transcribeAndAnalyzeAudioBlob(file);
  };

  const handleRunTextAnalysis = async () => {
    if (!editedTranscript.trim()) return;

    setIsAnalyzingTranscript(true);
    try {
      const resp = await mlApi.analyzeComplaint(
        editedTranscript,
        selectedLanguage,
        complainantName,
        complainantPhone
      );
      applyAnalysisResult(resp);
      addToast(
        'ML Analysis Complete',
        `Predicted: ${resp.classification.predicted_category} (${(resp.classification.confidence * 100).toFixed(1)}% confidence)`,
        'success'
      );
    } catch (err: any) {
      console.warn('Analysis error:', err);
      addToast('Analysis Notice', err.message || 'Could not reach ML Backend.', 'warning');
    } finally {
      setIsAnalyzingTranscript(false);
    }
  };

  const handleApplyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = SAMPLE_AUDIO_PRESETS[index];
    setRawTranscript(preset.sampleTranscript);
    setEditedTranscript(preset.sampleTranscript);
    setHasEditedTranscript(false);
    setIncidentCategory(preset.category);
    setIncidentLocation(preset.location);
    setIncidentDescription(preset.sampleTranscript.slice(0, 160) + '...');
    setAudioFileName(`preset_recording_${index + 1}.wav`);
    setRecordingSeconds(parseInt(preset.duration.split(':')[1], 10));

    // Run text analysis on preset
    mlApi
      .analyzeComplaint(preset.sampleTranscript, 'en', complainantName, complainantPhone)
      .then((res) => applyAnalysisResult(res))
      .catch(() => {});
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
      // Trigger ML analysis if not yet run
      if (!mlPredictedCategory && editedTranscript) {
        handleRunTextAnalysis();
      }
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

  // ==========================================
  // Final Submission (SQLite Persistence + Local Fallback)
  // ==========================================

  const handleFinalSubmit = async () => {
    if (!declarationChecked) {
      setErrors({ declaration: 'You must acknowledge the truthfulness declaration.' });
      return;
    }

    setIsSubmitting(true);
    let finalRef = `AS-2026-0${Math.floor(500 + Math.random() * 499)}`;

    try {
      // 1. Attempt real SQLite persistence on FastAPI backend
      const savedCase = await mlApi.createComplaint({
        complainant_name: complainantName,
        complainant_phone: complainantPhone,
        complainant_email: complainantEmail,
        complainant_address: complainantAddress,
        incident_category: incidentCategory,
        predicted_category: mlPredictedCategory || incidentCategory,
        model_confidence: mlConfidence || 0.0,
        incident_date: incidentDate,
        incident_time: incidentTime,
        incident_location: incidentLocation,
        incident_landmark: incidentLandmark,
        description: incidentDescription,
        original_transcript: rawTranscript,
        corrected_transcript: editedTranscript,
        is_transcript_edited: hasEditedTranscript,
        priority,
        police_station: policeStation,
        extracted_entities: extractedEntities,
      });

      finalRef = savedCase.referenceNumber;
      setIsBackendSaved(true);

      // Sync into React Context so dashboards update immediately
      addComplaint({
        referenceNumber: finalRef,
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

      setSelectedComplaintId(savedCase.id);
      addToast('Complaint Lodged', `Saved to database with Reference ${finalRef}.`, 'success');
    } catch (err: any) {
      console.warn('Backend SQLite persistence failed, falling back to local state:', err);
      setIsBackendSaved(false);

      // Fallback: Save to React Context / LocalStorage
      const newCase = addComplaint({
        referenceNumber: finalRef,
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

      setSelectedComplaintId(newCase.id);
      addToast('Lodged in Local State', `Backend offline; saved locally as ${finalRef}.`, 'info');
    } finally {
      setSubmittedReference(finalRef);
      setIsSubmitting(false);
    }
  };

  // If already submitted, display confirmation screen
  if (submittedReference) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
              isBackendSaved
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isBackendSaved ? 'Registered in SQLite Database' : 'Saved in Local State (Offline Mode)'}
          </span>

          <h2 className="text-2xl font-bold text-slate-900">Complaint Lodged for Review</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Your statement and incident details have been registered into the station triage queue. An assigned officer
            will review the transcript and verify jurisdiction.
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

          {/* Non-FIR Prototype Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 max-w-lg mx-auto text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Academic Demonstration Notice:</strong> This submission is an AI-assisted intake for police review.
              It does NOT register a legally valid FIR and does NOT replace an authorized police station house officer.
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
            <h1 className="text-2xl font-bold text-slate-900">Lodge New Incident Complaint</h1>
            <p className="text-xs text-slate-500">
              Speak or upload audio, inspect Whisper transcript, review trained ML classification, and lodge complaint.
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
            { num: 2, label: 'Review Transcript & ML' },
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
              <div className="text-[11px] uppercase tracking-wider hidden sm:block">Step {s.num}</div>
              <div className="text-xs truncate">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: Real Voice Input & Audio Upload                        */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Active Integration Status Banner */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Live ML Engine Connected:</strong> Browser microphone records real audio via MediaRecorder API
              and sends it to <strong>faster-whisper</strong> on your FastAPI backend for Hindi & English speech recognition.
            </div>
          </div>

          {/* Language Hint Selection */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">Audio Language Hint:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  selectedLanguage === 'en'
                    ? 'bg-police-900 text-white border-police-900'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  selectedLanguage === 'hi'
                    ? 'bg-police-900 text-white border-police-900'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                हिंदी (Hindi / Hinglish)
              </button>
            </div>
          </div>

          {/* Voice Recording Panel (MediaRecorder) */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50">
            <div className="max-w-md mx-auto">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md transition-all ${
                  isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-police-900 text-amber-400'
                }`}
              >
                <Mic className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {isRecording ? 'Recording Live Microphone Audio...' : 'Real Microphone Incident Recording'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Speak clearly in Hindi, English, or Hinglish to describe what occurred.
              </p>

              {/* Waveform Animation during recording */}
              <div className="my-5 flex items-center justify-center gap-1.5 h-10">
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-1' : 'h-3'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-2' : 'h-6'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-3' : 'h-4'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-4' : 'h-7'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-5' : 'h-5'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-2' : 'h-8'}`} />
                <div className={`w-1.5 bg-police-600 rounded-full transition-all ${isRecording ? 'animate-wave-1' : 'h-4'}`} />
              </div>

              {/* Timer Display */}
              <div className="font-mono text-xl font-bold text-slate-800 mb-4">
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRealRecording}
                    disabled={isProcessingAudio}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4 fill-white" />
                    <span>Start Microphone Recording</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRealRecording}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs sm:text-sm rounded-xl shadow flex items-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording & Transcribe</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetRecording}
                  disabled={isRecording || isProcessingAudio}
                  className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl"
                  title="Reset recording"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Recorded Audio Playback Preview */}
              {recordedAudioUrl && !isRecording && (
                <div className="mt-4 p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                  <div className="text-left w-full sm:w-auto">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{audioFileName}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Ready for transcription</p>
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    <audio controls src={recordedAudioUrl} className="h-8 max-w-[180px]" />
                    {recordedAudioBlob && (
                      <button
                        type="button"
                        onClick={() => transcribeAndAnalyzeAudioBlob(recordedAudioBlob)}
                        disabled={isProcessingAudio}
                        className="px-3 py-1.5 bg-police-800 hover:bg-police-900 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
                        title="Transcribe with faster-whisper"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Transcribe</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Loading / Processing Indicator */}
              {isProcessingAudio && (
                <div className="mt-4 p-3 bg-police-50 border border-police-200 rounded-xl flex items-center justify-center gap-2 text-xs text-police-900">
                  <div className="w-4 h-4 border-2 border-police-900 border-t-transparent rounded-full animate-spin" />
                  <span>{audioProcessingMessage}</span>
                </div>
              )}

              {/* Error Alert */}
              {audioError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{audioError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Audio File Upload Dropzone */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Upload Pre-recorded Audio File</p>
                <p className="text-[11px] text-slate-500">
                  Supported formats: WAV, MP3, M4A, OGG, WebM, FLAC (Max 25 MB)
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".wav,.mp3,.m4a,.ogg,.webm,.flac,.aac"
              onChange={handleManualAudioFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingAudio}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-300"
            >
              Choose Audio File...
            </button>
          </div>

          {/* Preset Picker for Quick Presentation Demo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Load Presentation Sample Preset:
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

          {/* Navigation Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              disabled={isProcessingAudio}
              className="px-6 py-2.5 bg-police-800 hover:bg-police-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2"
            >
              <span>Continue to Transcript & ML Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: Review & Edit Transcript + ML Classification           */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Speech-to-Text Transcript & ML Prediction Inspection
              </h3>
              <p className="text-xs text-slate-500">
                Inspect the transcribed text below. You can correct misheard words, then re-analyze with the trained ML classifier.
              </p>
            </div>
            {hasEditedTranscript && (
              <span className="self-start sm:self-center px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium">
                Edited by Complainant
              </span>
            )}
          </div>

          {/* Whisper Metadata Pill */}
          {whisperProcessingTime !== null && (
            <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>
                Speech transcribed by <strong>faster-whisper</strong> in{' '}
                <strong>{whisperProcessingTime}s</strong> (Language detected:{' '}
                <strong>{detectedLanguage?.toUpperCase() || 'EN'}</strong>).
              </span>
            </div>
          )}

          {/* Editable Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Transcript Text (Directly Editable)
              </label>
              <button
                type="button"
                onClick={handleRunTextAnalysis}
                disabled={isAnalyzingTranscript}
                className="px-3 py-1 bg-police-50 hover:bg-police-100 text-police-800 border border-police-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-police-700" />
                <span>{isAnalyzingTranscript ? 'Running Classifier...' : 'Re-analyze with ML Model'}</span>
              </button>
            </div>

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

          {/* Real ML Classification Result Card */}
          {mlPredictedCategory && (
            <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-blue-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-police-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Trained ML Model Prediction ({mlModelName})
                  </span>
                </div>
                {mlConfidence !== null && (
                  <span className="px-2.5 py-1 bg-police-900 text-amber-300 text-xs font-mono font-bold rounded-lg shadow-sm">
                    {(mlConfidence * 100).toFixed(1)}% Confidence
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-500">Predicted Category:</span>
                  <p className="text-base font-bold text-police-900">{mlPredictedCategory}</p>
                </div>
                <div className="text-xs text-slate-600 sm:text-right">
                  <span className="text-[11px] text-slate-500">Mapped to UI Category:</span>
                  <p className="font-semibold text-emerald-800">{incidentCategory}</p>
                </div>
              </div>

              {/* Class Probabilities Distribution */}
              {Object.keys(mlProbabilities).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Class Probability Distribution (from trained model):
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(mlProbabilities)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([cat, prob]) => (
                        <div key={cat} className="flex items-center gap-3 text-xs">
                          <span className="w-28 truncate font-medium text-slate-700">{cat}</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-police-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(prob * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono text-[11px] text-slate-600">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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

      {/* ============================================================== */}
      {/* STEP 3: Structured Incident Details Form + NLP Auto-Fill       */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Structured Incident Particulars</h3>
              <p className="text-xs text-slate-500">
                Verified incident particulars extracted by NLP and confirmed by the complainant.
              </p>
            </div>
            {mlPredictedCategory && (
              <span className="self-start sm:self-center px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-md text-[11px] font-medium flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-blue-700" />
                <span>Pre-filled via NLP & ML</span>
              </span>
            )}
          </div>

          {/* NLP Extracted Entities Chips */}
          {Object.keys(extractedEntities).length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                NLP Extracted Incident Facts:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(extractedEntities).map(([type, values]) =>
                  values && values.length > 0 ? (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700"
                    >
                      <Tag className="w-3 h-3 text-police-600" />
                      <strong>{type}:</strong> {values.join(', ')}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Missing Information & Follow-Up Questions Alert Box */}
          {missingFields.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Missing Information Detected for {mlPredictedCategory || 'this Category'}</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                The NLP rule engine noted that the following details could not be found in your statement:
              </p>
              <ul className="list-disc pl-5 text-xs text-amber-800 space-y-1">
                {followUpQuestions.map((q, idx) => (
                  <li key={idx} className="font-medium">
                    {q}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 italic pt-1">
                Please complete the fields below to ensure the station review officer has complete facts.
              </p>
            </div>
          )}

          {/* Incident Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Incident Category *</label>
                {mlPredictedCategory && (
                  <span className="text-[10px] text-police-700 font-semibold bg-police-50 px-2 py-0.5 rounded">
                    ML Suggested: {mlPredictedCategory}
                  </span>
                )}
              </div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Priority Level</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Incident *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
                />
              </div>
              {errors.incidentDate && <p className="text-[11px] text-red-600 mt-1">{errors.incidentDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approximate Time *</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="time"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
                />
              </div>
              {errors.incidentTime && <p className="text-[11px] text-red-600 mt-1">{errors.incidentTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jurisdiction Station *</label>
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Specific Location *</label>
                {nlpPreFilledFields.location && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Extracted from Speech
                  </span>
                )}
              </div>
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
              {errors.incidentLocation && <p className="text-[11px] text-red-600 mt-1">{errors.incidentLocation}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nearest Landmark (Optional)</label>
              <input
                type="text"
                value={incidentLandmark}
                onChange={(e) => setIncidentLandmark(e.target.value)}
                placeholder="e.g. Opp Coffee Day Kiosk"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Incident Description / Structured Summary */}
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
                <label className="block text-xs text-slate-600 mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                {errors.complainantName && <p className="text-[11px] text-red-600 mt-1">{errors.complainantName}</p>}
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Contact Phone Number *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={complainantPhone}
                    onChange={(e) => setComplainantPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                {errors.complainantPhone && <p className="text-[11px] text-red-600 mt-1">{errors.complainantPhone}</p>}
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

      {/* ============================================================== */}
      {/* STEP 4: Final Factsheet Verification & Submission             */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Final Verification & Submission</h3>
            <p className="text-xs text-slate-500">
              Review all details before generating your official complaint reference token.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Incident Particulars */}
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
                <span className="font-semibold text-slate-800">
                  {incidentDate} at {incidentTime}
                </span>
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
                <span className="font-mono text-slate-700">{audioFileName}</span>
              </div>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Attached Verified Transcript
              </p>
              {hasEditedTranscript && <span className="text-[10px] text-amber-700 font-medium">User Corrected</span>}
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
                <strong>Citizen Declaration:</strong> I state that the facts narrated in this complaint draft are true to
                the best of my knowledge. I understand this submission is an AI-assisted intake for police review and does
                not automatically constitute a legally registered FIR.
              </span>
            </label>
            {errors.declaration && <p className="text-[11px] text-red-600 font-semibold">{errors.declaration}</p>}
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
