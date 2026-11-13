import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FilePlus2,
  Search,
  Filter,
  Clock,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
  Mic,
  Calendar,
  MapPin,
  RefreshCw,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';

export const ComplainantDashboard: React.FC = () => {
  const {
    currentUser,
    complaints,
    setActivePage,
    setSelectedComplaintId,
    demoViewMode,
    setDemoViewMode,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter complaints based on current persona or all complaints for demo flexibility
  const userComplaints = complaints; // In demo, show available mock complaints to inspect

  const filteredComplaints = userComplaints.filter((c) => {
    const matchesSearch =
      c.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incidentCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incidentLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL' || c.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleCardClick = (id: string) => {
    setSelectedComplaintId(id);
    setActivePage('complaint-detail');
  };

  const pendingCount = userComplaints.filter((c) => c.status === 'Pending Review').length;
  const underReviewCount = userComplaints.filter((c) => c.status === 'Under Review').length;
  const needsInfoCount = userComplaints.filter((c) => c.status === 'Needs More Information').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-police-900 to-police-800 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
          <Mic className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Citizen Portal
              </span>
              <span className="text-slate-300 text-xs">AwaazSetu Grievance Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {currentUser?.name || 'Citizen'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Track your filed incident reports, review officer status updates, or lodge a new voice-assisted grievance.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setActivePage('new-complaint')}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-police-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <FilePlus2 className="w-5 h-5 text-police-950" />
              <span>File New Complaint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo View State Switcher Toolbar (Required for presenting Empty/Loading/Error states) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Sparkles className="w-4 h-4 text-police-600" />
          <span className="font-semibold text-slate-700">Presentation Demo Mode:</span>
          <span className="text-slate-500 hidden sm:inline">Switch view states for teacher review:</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setDemoViewMode('normal')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              demoViewMode === 'normal'
                ? 'bg-white text-police-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal Data ({userComplaints.length})
          </button>
          <button
            onClick={() => setDemoViewMode('empty')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              demoViewMode === 'empty'
                ? 'bg-white text-police-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Empty State
          </button>
          <button
            onClick={() => setDemoViewMode('loading')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              demoViewMode === 'loading'
                ? 'bg-white text-police-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loading State
          </button>
          <button
            onClick={() => setDemoViewMode('error')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              demoViewMode === 'error'
                ? 'bg-white text-police-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Error State
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Total Filed</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {demoViewMode === 'empty' ? 0 : userComplaints.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Complaints in demo record</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase">Pending Triage</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-2">
            {demoViewMode === 'empty' ? 0 : pendingCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting station officer</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700 uppercase">Under Review</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">
            {demoViewMode === 'empty' ? 0 : underReviewCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active inquiry initiated</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-700 uppercase">Action Needed</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-800 mt-2">
            {demoViewMode === 'empty' ? 0 : needsInfoCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Officer requested info</p>
        </div>
      </div>

      {/* Main Content Area based on demoViewMode */}
      {demoViewMode === 'loading' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-police-200 border-t-police-600 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">
            Retrieving Grievance Records...
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Simulating server retrieval and audio transcript verification across police station nodes.
          </p>
        </div>
      ) : demoViewMode === 'error' ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Unable to Load Complaints (Simulated Demo Error)
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            This state demonstrates how the UI handles network disconnects or API service timeouts gracefully without breaking.
          </p>
          <button
            onClick={() => setDemoViewMode('normal')}
            className="mt-4 px-4 py-2 bg-police-800 hover:bg-police-900 text-white text-xs font-semibold rounded-lg shadow"
          >
            Retry Connection (Return to Normal)
          </button>
        </div>
      ) : demoViewMode === 'empty' || filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Mic className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Complaints Filed Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            You currently have no active or archived complaints. You can use voice dictation or text input to lodge a new grievance.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setActivePage('new-complaint')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-police-950 font-bold text-xs sm:text-sm rounded-lg shadow transition-all flex items-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Record Your First Complaint</span>
            </button>
            {demoViewMode === 'empty' && (
              <button
                onClick={() => setDemoViewMode('normal')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg"
              >
                Reset to Sample Data
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reference, keyword, location..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Filter:</span>
              {(['ALL', 'Pending Review', 'Under Review', 'Needs More Information', 'Closed (Prototype)'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedStatus === status
                      ? 'bg-police-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Complaints' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Complaints List Cards */}
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() => handleCardClick(complaint.id)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-police-300 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-police-900 rounded border border-slate-200 group-hover:border-police-400 transition-colors">
                      {complaint.referenceNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {complaint.incidentCategory}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={complaint.priority} />
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-slate-800 line-clamp-2 leading-relaxed">
                    {complaint.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Incident: {complaint.incidentDate} at {complaint.incidentTime}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-xs">{complaint.incidentLocation}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-police-700 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>View Case Tracking & Timeline</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
