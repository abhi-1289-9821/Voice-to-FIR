import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Shield,
  Play,
  Pause,
  Volume2,
  Printer,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';

export const ComplaintDetailPage: React.FC = () => {
  const { complaints, selectedComplaintId, setActivePage, addToast } = useApp();

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress] = useState<number>(30);
  const [showAddInfoModal, setShowAddInfoModal] = useState<boolean>(false);
  const [additionalNote, setAdditionalNote] = useState<string>('');

  const complaint =
    complaints.find((c) => c.id === selectedComplaintId) || complaints[0];

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600">No complaint found.</p>
        <button
          onClick={() => setActivePage('complainant-dashboard')}
          className="mt-4 px-4 py-2 bg-police-800 text-white rounded-lg text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleSendAdditionalInfo = () => {
    if (!additionalNote.trim()) return;
    addToast(
      'Information Submitted (Demo)',
      'Your clarification note has been appended to the officer review queue.',
      'success'
    );
    setAdditionalNote('');
    setShowAddInfoModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => setActivePage('complainant-dashboard')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-police-700 hover:text-police-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={() => setShowAddInfoModal(true)}
            className="px-3.5 py-1.5 bg-police-800 hover:bg-police-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Provide Additional Info</span>
          </button>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Case Tracking Dossier
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-police-700 font-medium">
                {complaint.policeStation}
              </span>
            </div>
            <h1 className="text-2xl font-mono font-bold text-slate-900">
              {complaint.referenceNumber}
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              {complaint.incidentCategory}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500">
              Filed: {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
              {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Prototype Legal Disclaimer Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Legal Reference Notice:</strong> This reference is assigned for digital police inquiry triage. 
            It is not a registered criminal FIR until validated by an authorized investigating officer in accordance with law.
          </span>
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Details & Audio Transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Factsheet Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Incident Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 font-medium">Date & Time of Occurrence</p>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    {complaint.incidentDate} around {complaint.incidentTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 font-medium">Location of Occurrence</p>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    {complaint.incidentLocation}
                  </p>
                  {complaint.incidentLandmark && (
                    <p className="text-[11px] text-slate-500">
                      Landmark: {complaint.incidentLandmark}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 font-medium">Assigned Officer</p>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    {complaint.assignedOfficer || 'Under Initial Duty Allocation'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 font-medium">Last Status Update</p>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    {new Date(complaint.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Incident Description & Narrative:
              </p>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* Voice Record & Transcribed Speech */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Voice Audio Record & Transcribed Speech
              </h3>
              <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                Mock Audio Pipeline
              </span>
            </div>

            {/* Mock Audio Player */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-10 h-10 rounded-full bg-police-800 hover:bg-police-900 text-white flex items-center justify-center flex-shrink-0 shadow transition-colors"
                title={isPlayingAudio ? 'Pause mock audio' : 'Play mock audio'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>

              <div className="flex-1 w-full space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">
                    {isPlayingAudio ? '00:15' : '00:00'}
                  </span>
                  <span className="font-mono">
                    00:{complaint.mockAudioLengthSeconds || 42}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 cursor-pointer relative overflow-hidden">
                  <div
                    className="bg-police-600 h-2 rounded-full transition-all"
                    style={{ width: `${isPlayingAudio ? 45 : audioProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Volume2 className="w-4 h-4" />
                <span className="text-[11px] font-mono text-slate-600">100%</span>
              </div>
            </div>

            {/* Transcript Text */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Complainant-Verified Speech Transcript:
                </span>
                {complaint.isTranscriptEdited && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    (Edited by citizen prior to submission)
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                "{complaint.rawTranscript}"
              </p>
            </div>
          </div>

          {/* Official Officer Review Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Official Police Review Notes ({complaint.officerNotes.length})
            </h3>

            {complaint.officerNotes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No formal notes added yet. Case is in the station triage review queue.
              </p>
            ) : (
              <div className="space-y-3">
                {complaint.officerNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950">
                        {note.officerName} ({note.badgeNumber})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(note.timestamp).toLocaleDateString()} at{' '}
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Status Timeline & Complainant Contact */}
        <div className="space-y-6">
          {/* Status Timeline Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Case Status Timeline
            </h3>

            <div className="mt-4 relative pl-4 border-l-2 border-slate-200 space-y-6">
              {complaint.timeline.map((event, idx) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      idx === complaint.timeline.length - 1
                        ? 'border-police-600 bg-police-600'
                        : 'border-slate-400 bg-slate-200'
                    }`}
                  />

                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                      {new Date(event.timestamp).toLocaleDateString()} •{' '}
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="mt-0.5">
                      <StatusBadge status={event.status} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1">
                      {event.actor} ({event.role})
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {event.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complainant Contact Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Registered Complainant
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="font-semibold text-slate-900">{complaint.complainantName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{complaint.complainantPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700 truncate">{complaint.complainantEmail}</span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600 leading-relaxed">{complaint.complainantAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Modal */}
      {showAddInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Submit Clarification / Additional Information
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide additional serial numbers, photos reference, or witness names to the investigating officer.
            </p>

            <div className="mt-4">
              <textarea
                rows={4}
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="e.g. Additional witness: Shopkeeper Mr. Suresh at Gate 2 (+91 98888 11111)..."
                className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddInfoModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAdditionalInfo}
                className="px-4 py-2 bg-police-800 hover:bg-police-900 text-white text-xs font-semibold rounded-lg shadow"
              >
                Submit Note (Demo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
