import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
} from 'lucide-react';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { UserRole, UserAccount } from '../types';

export const AdminPage: React.FC = () => {
  const {
    users,
    activities,
    complaints,
    updateUserStatus,
    updateUserRole,
    resetDemoData,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Confirmation modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'primary';
    confirmLabel: string;
  }>({
    title: '',
    message: '',
    action: () => {},
    variant: 'danger',
    confirmLabel: 'Confirm',
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.badgeNumber && u.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.station && u.station.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = (user: UserAccount) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    setModalConfig({
      title: `${newStatus === 'Suspended' ? 'Suspend' : 'Activate'} User Account?`,
      message: `Are you sure you want to change the status of ${user.name} (${user.email}) to ${newStatus}? This affects demo state only.`,
      variant: newStatus === 'Suspended' ? 'danger' : 'primary',
      confirmLabel: `${newStatus === 'Suspended' ? 'Suspend Account' : 'Activate Account'}`,
      action: () => updateUserStatus(user.id, newStatus),
    });
    setModalOpen(true);
  };

  const handleChangeRole = (user: UserAccount, newRole: UserRole) => {
    setModalConfig({
      title: `Change User Role to ${newRole.toUpperCase()}?`,
      message: `Are you sure you want to change ${user.name}'s role from ${user.role} to ${newRole}? This updates demo permissions immediately.`,
      variant: 'warning',
      confirmLabel: 'Update Role',
      action: () => updateUserRole(user.id, newRole),
    });
    setModalOpen(true);
  };

  const activeOfficerCount = users.filter((u) => u.role === 'officer' && u.status === 'Active').length;
  const activeComplainantCount = users.filter((u) => u.role === 'complainant' && u.status === 'Active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Command Header */}
      <div className="bg-police-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-police-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-900/60 border border-purple-700 flex items-center justify-center text-purple-300 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                System Administration & Governance
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Admin: {currentUser?.name || 'Central Command'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              AwaazSetu Platform Administration
            </h1>
            <p className="text-xs text-slate-300">
              Manage user roles, toggle account statuses with confirmation gates, and monitor system activity audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setModalConfig({
                title: 'Reset Demo Data to Initial State?',
                message:
                  'This will reset all complaints, users, officer notes, and system audit logs back to their factory demo defaults.',
                variant: 'warning',
                confirmLabel: 'Reset Everything',
                action: resetDemoData,
              });
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-police-800 hover:bg-police-700 text-amber-300 border border-police-700 font-semibold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      {/* System Diagnostic Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Registered Users</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{activeComplainantCount} Citizens, {activeOfficerCount} Officers</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-medium text-blue-700 uppercase">Active Officers</span>
          <p className="text-2xl font-bold text-blue-900 mt-1 font-mono">{activeOfficerCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Assigned to police stations</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-medium text-amber-700 uppercase">Total Cases Logged</span>
          <p className="text-2xl font-bold text-amber-900 mt-1 font-mono">{complaints.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Complaints in demo registry</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-medium text-emerald-700 uppercase">Whisper STT Pipeline</span>
          <p className="text-xs font-bold text-emerald-800 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Simulated Mock v1.0</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">faster-whisper planned in Phase 3</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              User Accounts & Role Permissions
            </h3>
            <p className="text-xs text-slate-500">
              Control demo account access, change role assignments, or suspend users with confirmation safeguards.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, badge, station..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto">
              {(['ALL', 'complainant', 'officer', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                    roleFilter === r
                      ? 'bg-police-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">User & Identity</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Station / Badge</th>
                <th className="px-5 py-3">Account Status</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-police-500 cursor-pointer"
                      >
                        <option value="complainant">Complainant</option>
                        <option value="officer">Police Officer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    {user.station || user.badgeNumber ? (
                      <div>
                        {user.badgeNumber && (
                          <span className="font-mono text-[11px] text-slate-800 font-semibold block">
                            {user.badgeNumber}
                          </span>
                        )}
                        {user.station && (
                          <span className="text-[11px] text-slate-500">{user.station}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">N/A (Citizen)</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {user.status === 'Active' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                      )}
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        user.status === 'Active'
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Activity Panel (Audit Events) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-police-600" />
              <span>System Activity Audit Log</span>
            </h3>
            <p className="text-xs text-slate-500">
              Immutable audit trail of complaint submissions, status modifications, and account actions (demo records).
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {activities.length} Events Recorded
          </span>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-police-700 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{act.action}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                      {act.actorRole}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{act.details}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Actor: <span className="text-slate-600 font-medium">{act.actorName}</span>
                    {act.ipAddress && <span> • IP: {act.ipAddress}</span>}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap self-end sm:self-center">
                {new Date(act.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmLabel={modalConfig.confirmLabel}
        onConfirm={modalConfig.action}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
