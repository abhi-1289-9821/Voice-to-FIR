import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BadgeAlert,
  Search,
  CheckCircle2,
  Play,
  Pause,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { ComplaintStatus } from '../types';

export const OfficerDashboard: React.FC = () => {
  const { complaints, updateComplaintStatus, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>(
    complaints[0]?.id || ''
  );

  // Status updating form state
  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) || complaints[0];
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(
    selectedComplaint?.status || 'Under Review'
  );
  const [officerNoteText, setOfficerNoteText] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Sync status dropdown when switching complaints
  React.useEffect(() => {
    if (selectedComplaint) {
      setNewStatus(selectedComplaint.status);
      setOfficerNoteText('');
      setIsPlayingAudio(false);
    }
  }, [selectedComplaintId]);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complainantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incidentCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incidentLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' || c.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    updateComplaintStatus(
      selectedComplaint.id,
      newStatus,
      officerNoteText.trim() || undefined,
      currentUser?.name || 'Sub-Inspector Rajesh Kumar'
    );

    setOfficerNoteText('');
  };

  const handleInsertCannedNote = (note: string) => {
    setOfficerNoteText((prev) => (prev ? `${prev} ${note}` : note));
  };

  // Metrics
  const pendingCount = complaints.filter((c) => c.status === 'Pending Review').length;
  const underReviewCount = complaints.filter((c) => c.status === 'Under Review').length;
  const needsInfoCount = complaints.filter((c) => c.status === 'Needs More Information').length;
  const closedCount = complaints.filter((c) => c.status === 'Closed (Prototype)').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Officer Command Banner */}
      <div className="bg-police-950 text-white rounded-2xl p-6 shadow-md mb-8 border border-police-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-police-800 border border-police-700 flex items-center justify-center text-amber-400 shadow-inner">
            <BadgeAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Station Triage Console
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Badge: {currentUser?.badgeNumber || 'KA-BPS-4891'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {currentUser?.name || 'Sub-Inspector Rajesh Kumar'}
            </h1>
            <p className="text-xs text-slate-300">
              {currentUser?.station || 'Indiranagar Police Station, Bengaluru'}
            </p>
          </div>
        </div>

        {/* Quick Triage Counters */}
        <div className="flex items-center gap-3 bg-police-900/80 p-3 rounded-xl border border-police-800">
          <div className="text-center px-3 border-r border-police-800">
            <p className="text-xs text-amber-400 font-medium">Pending</p>
            <p className="text-lg font-bold text-white font-mono">{pendingCount}</p>
          </div>
          <div className="text-center px-3 border-r border-police-800">
            <p className="text-xs text-blue-400 font-medium">Under Review</p>
            <p className="text-lg font-bold text-white font-mono">{underReviewCount}</p>
          </div>
          <div className="text-center px-3 border-r border-police-800">
            <p className="text-xs text-purple-400 font-medium">Needs Info</p>
            <p className="text-lg font-bold text-white font-mono">{needsInfoCount}</p>
          </div>
          <div className="text-center px-3">
            <p className="text-xs text-slate-400 font-medium">Closed</p>
            <p className="text-lg font-bold text-white font-mono">{closedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Split Interface: Left = Complaint Triage Queue, Right = Officer Case Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Queue List & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reference, citizen, crime..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'Pending Review', 'Under Review', 'Needs More Information', 'Closed (Prototype)'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                      selectedStatusFilter === status
                        ? 'bg-police-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL'
                      ? 'All'
                      : status === 'Needs More Information'
                      ? 'Needs Info'
                      : status === 'Closed (Prototype)'
                      ? 'Closed'
                      : status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Queue Count */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {filteredComplaints.length} incoming case records</span>
            <span className="text-[11px] font-mono text-slate-400">Local Demo State</span>
          </div>

          {/* Complaints Scroll List */}
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No complaints match the selected filter criteria.
              </div>
            ) : (
              filteredComplaints.map((c) => {
                const isSelected = c.id === selectedComplaint?.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaintId(c.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-police-500 shadow-sm ring-1 ring-police-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-police-950">
                        {c.referenceNumber}
                      </span>
                      <StatusBadge status={c.status} size="sm" />
                    </div>

                    <p className="text-xs font-semibold text-slate-900">
                      {c.complainantName}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                      {c.incidentCategory} • {c.incidentLocation}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Case Detail & Officer Action Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedComplaint ? (
            <>
              {/* Selected Complaint Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-police-900">
                        {selectedComplaint.referenceNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {selectedComplaint.incidentCategory}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Complainant: <strong>{selectedComplaint.complainantName}</strong> ({selectedComplaint.complainantPhone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={selectedComplaint.priority} />
                    <StatusBadge status={selectedComplaint.status} size="md" />
                  </div>
                </div>

                {/* Structured Facts */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Date & Time:</span>
                    <span className="font-medium text-slate-900">
                      {selectedComplaint.incidentDate} at {selectedComplaint.incidentTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Incident Location:</span>
                    <span className="font-medium text-slate-900 truncate block">
                      {selectedComplaint.incidentLocation}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Station Jurisdiction:</span>
                    <span className="font-medium text-slate-900">
                      {selectedComplaint.policeStation}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Assigned Officer:</span>
                    <span className="font-medium text-slate-900">
                      {selectedComplaint.assignedOfficer || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Incident Narrative */}
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Complainant's Written Narrative:
                  </p>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Audio Recording & Speech Transcript Side-by-Side */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Voice Recording & Speech Transcript
                    </p>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                      faster-whisper mock
                    </span>
                  </div>

                  {/* Mock Audio Player */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-police-800 hover:bg-police-900 text-white flex items-center justify-center flex-shrink-0 shadow transition-colors"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-3.5 h-3.5 fill-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{isPlayingAudio ? '00:15' : '00:00'}</span>
                        <span>00:{selectedComplaint.mockAudioLengthSeconds || 42}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-police-600 h-1.5 rounded-full"
                          style={{ width: isPlayingAudio ? '40%' : '15%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transcript */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 italic leading-relaxed">
                    "{selectedComplaint.rawTranscript}"
                  </div>
                </div>
              </div>

              {/* Officer Action & Status Update Console */}
              <div className="bg-white rounded-2xl border-2 border-police-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Officer Triage Action Panel
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update case status and log official inquiry notes (modifies local demo state).
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-police-700 bg-police-50 px-2 py-0.5 rounded">
                    Demo Mode
                  </span>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Change Complaint Status *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Pending Review', 'Under Review', 'Needs More Information', 'Closed (Prototype)'] as const).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setNewStatus(status)}
                            className={`p-2 rounded-lg border text-xs text-center transition-all ${
                              newStatus === status
                                ? 'bg-police-900 text-white font-bold border-police-900 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {status === 'Needs More Information'
                              ? 'Needs Info'
                              : status === 'Closed (Prototype)'
                              ? 'Closed'
                              : status}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Canned Shortcuts */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Canned Police Note Presets (Click to insert):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'CCTV footage requested from station control room.',
                        'Complainant contacted via phone for statement verification.',
                        'Requested RC copy and engine/chassis number verification.',
                        'Forwarded to Beat Patrol Officer for spot inquiry.',
                        'Non-cognizable acknowledgment issued. Case archived.',
                      ].map((canned) => (
                        <button
                          key={canned}
                          type="button"
                          onClick={() => handleInsertCannedNote(canned)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-md transition-colors"
                        >
                          + {canned.slice(0, 32)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Investigation / Review Note
                    </label>
                    <textarea
                      rows={3}
                      value={officerNoteText}
                      onChange={(e) => setOfficerNoteText(e.target.value)}
                      placeholder="Add official station remark, instructions for citizen, or investigation summary..."
                      className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-police-800 hover:bg-police-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Commit Status & Log Note (Local Demo)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Officer Notes Log */}
              {selectedComplaint.officerNotes.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Past Officer Notes for {selectedComplaint.referenceNumber}
                  </h4>
                  <div className="space-y-2">
                    {selectedComplaint.officerNotes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                          <span className="font-bold text-slate-800">
                            {n.officerName} ({n.badgeNumber})
                          </span>
                          <span>{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800">{n.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Select a complaint from the left queue to open the officer review console.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
