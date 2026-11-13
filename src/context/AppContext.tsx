import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Complaint,
  ComplaintStatus,
  UserAccount,
  UserRole,
  SystemActivity,
  TimelineEvent,
  OfficerNote,
} from '../types';
import {
  INITIAL_COMPLAINTS,
  INITIAL_USERS,
  INITIAL_ACTIVITIES,
} from '../data/mockData';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  // Navigation & Page routing
  activePage: string;
  setActivePage: (page: string) => void;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;

  // Active session
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;

  // Data sets
  complaints: Complaint[];
  users: UserAccount[];
  activities: SystemActivity[];

  // Mutations
  addComplaint: (newComplaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'officerNotes'>) => Complaint;
  updateComplaintStatus: (
    complaintId: string,
    newStatus: ComplaintStatus,
    noteText?: string,
    officerName?: string
  ) => void;
  updateUserStatus: (userId: string, newStatus: 'Active' | 'Suspended') => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  resetDemoData: () => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (title: string, description: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Presentation State Controls (for demoing loading, error, empty states)
  demoViewMode: 'normal' | 'empty' | 'loading' | 'error';
  setDemoViewMode: (mode: 'normal' | 'empty' | 'loading' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_COMPLAINTS = 'awaazsetu_complaints_v1';
const STORAGE_KEY_USERS = 'awaazsetu_users_v1';
const STORAGE_KEY_ACTIVITIES = 'awaazsetu_activities_v1';
const STORAGE_KEY_USER = 'awaazsetu_active_user_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<string>('landing');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>('c-001');
  const [demoViewMode, setDemoViewMode] = useState<'normal' | 'empty' | 'loading' | 'error'>('normal');

  // Load from local storage or defaults
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
      return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
    } catch {
      return INITIAL_COMPLAINTS;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [activities, setActivities] = useState<SystemActivity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default to Complainant Rohan Sharma
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [complaints]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [activities]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [currentUser]);

  const addToast = (title: string, description: string, type: ToastMessage['type'] = 'info') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loginAsRole = (role: UserRole) => {
    const matched = users.find((u) => u.role === role && u.status === 'Active') || {
      id: 'mock-' + role,
      name: role === 'complainant' ? 'Rohan Sharma' : role === 'officer' ? 'Sub-Inspector Rajesh Kumar' : 'System Administrator',
      email: `${role}.demo@awaazsetu.gov.demo`,
      role,
      status: 'Active' as const,
      lastLogin: new Date().toISOString(),
      createdAt: '2026-11-01T00:00:00.000Z',
    };

    setCurrentUser(matched);
    addToast('Logged in as Demo ' + (role === 'complainant' ? 'Citizen' : role === 'officer' ? 'Police Officer' : 'Administrator'), `Active persona: ${matched.name}`, 'info');

    if (role === 'complainant') {
      setActivePage('complainant-dashboard');
    } else if (role === 'officer') {
      setActivePage('officer-dashboard');
    } else {
      setActivePage('admin-dashboard');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePage('landing');
    addToast('Signed Out', 'Returned to landing page demo view.', 'info');
  };

  const addComplaint = (
    complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'officerNotes'>
  ): Complaint => {
    const nowIso = new Date().toISOString();
    const newId = 'c-' + Date.now();
    const initialTimeline: TimelineEvent[] = [
      {
        id: 't-' + Date.now(),
        timestamp: nowIso,
        status: 'Pending Review',
        actor: complaintData.complainantName,
        role: 'Complainant',
        note: `Complaint submitted via AwaazSetu portal. Reference ${complaintData.referenceNumber} generated for review.`,
      },
    ];

    const newComplaint: Complaint = {
      ...complaintData,
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: initialTimeline,
      officerNotes: [],
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    // Record system activity
    const newAct: SystemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      actorName: complaintData.complainantName,
      actorRole: 'complainant',
      action: 'Complaint Submitted',
      details: `New case lodged: ${complaintData.referenceNumber} (${complaintData.incidentCategory})`,
      ipAddress: '157.48.112.5',
    };
    setActivities((prev) => [newAct, ...prev]);

    addToast(
      'Complaint Submitted (Demo)',
      `Reference ${complaintData.referenceNumber} created and assigned to ${complaintData.policeStation}.`,
      'success'
    );

    return newComplaint;
  };

  const updateComplaintStatus = (
    complaintId: string,
    newStatus: ComplaintStatus,
    noteText?: string,
    officerName = 'Sub-Inspector Rajesh Kumar'
  ) => {
    const nowIso = new Date().toISOString();

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;

        const updatedTimeline: TimelineEvent[] = [
          ...c.timeline,
          {
            id: 't-' + Date.now(),
            timestamp: nowIso,
            status: newStatus,
            actor: officerName,
            role: 'Police Officer',
            note: noteText || `Case status changed to ${newStatus}.`,
          },
        ];

        const updatedNotes: OfficerNote[] = noteText
          ? [
              ...c.officerNotes,
              {
                id: 'n-' + Date.now(),
                timestamp: nowIso,
                officerName,
                badgeNumber: 'KA-BPS-4891',
                note: noteText,
              },
            ]
          : c.officerNotes;

        return {
          ...c,
          status: newStatus,
          updatedAt: nowIso,
          assignedOfficer: c.assignedOfficer || officerName,
          timeline: updatedTimeline,
          officerNotes: updatedNotes,
        };
      })
    );

    const newAct: SystemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      actorName: officerName,
      actorRole: 'officer',
      action: 'Status Updated',
      details: `Updated case ${complaintId} status to "${newStatus}"`,
      ipAddress: '10.45.12.89 (Police Intranet)',
    };
    setActivities((prev) => [newAct, ...prev]);

    addToast('Status Updated', `Case marked as "${newStatus}" in local demo state.`, 'success');
  };

  const updateUserStatus = (userId: string, newStatus: 'Active' | 'Suspended') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    const user = users.find((u) => u.id === userId);
    const newAct: SystemActivity = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser?.name || 'Administrator',
      actorRole: 'admin',
      action: newStatus === 'Active' ? 'Account Activated' : 'Account Suspended',
      details: `${newStatus === 'Active' ? 'Re-enabled' : 'Suspended'} user access for ${user?.name || userId}`,
    };
    setActivities((prev) => [newAct, ...prev]);

    addToast('User Updated', `Account status changed to ${newStatus}.`, 'info');
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    const user = users.find((u) => u.id === userId);
    const newAct: SystemActivity = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser?.name || 'Administrator',
      actorRole: 'admin',
      action: 'Role Modified',
      details: `Changed role of ${user?.name || userId} to ${newRole}`,
    };
    setActivities((prev) => [newAct, ...prev]);

    addToast('Role Changed', `User role updated to ${newRole}.`, 'info');
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_COMPLAINTS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
    localStorage.removeItem(STORAGE_KEY_USER);

    setComplaints(INITIAL_COMPLAINTS);
    setUsers(INITIAL_USERS);
    setActivities(INITIAL_ACTIVITIES);
    setCurrentUser(INITIAL_USERS[0]);
    setSelectedComplaintId('c-001');
    setDemoViewMode('normal');

    addToast('Demo State Reset', 'Initial sample complaints, users, and audit records restored.', 'warning');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedComplaintId,
        setSelectedComplaintId,
        currentUser,
        setCurrentUser,
        loginAsRole,
        logout,
        complaints,
        users,
        activities,
        addComplaint,
        updateComplaintStatus,
        updateUserStatus,
        updateUserRole,
        resetDemoData,
        toasts,
        addToast,
        removeToast,
        demoViewMode,
        setDemoViewMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

