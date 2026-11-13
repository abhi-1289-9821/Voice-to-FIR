export type UserRole = 'complainant' | 'officer' | 'admin';

export type ComplaintStatus =
  | 'Pending Review'
  | 'Under Review'
  | 'Needs More Information'
  | 'Closed (Prototype)';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export type ComplaintCategory =
  | 'Theft / Stolen Property'
  | 'Cybercrime / Online Fraud'
  | 'Physical Assault / Harassment'
  | 'Financial Fraud / Cheating'
  | 'Vehicle Theft / Traffic Incident'
  | 'Public Nuisance & Disturbance'
  | 'Lost & Found'
  | 'Other Grievance';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: ComplaintStatus;
  actor: string;
  role: string;
  note: string;
}

export interface OfficerNote {
  id: string;
  timestamp: string;
  officerName: string;
  badgeNumber: string;
  note: string;
}

export interface Complaint {
  id: string;
  referenceNumber: string;
  complainantName: string;
  complainantPhone: string;
  complainantEmail: string;
  complainantAddress: string;
  incidentCategory: ComplaintCategory;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentLandmark?: string;
  description: string;
  rawTranscript: string;
  isTranscriptEdited: boolean;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedOfficer?: string;
  policeStation: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  officerNotes: OfficerNote[];
  mockAudioLengthSeconds: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  station?: string;
  status: 'Active' | 'Suspended';
  lastLogin: string;
  createdAt: string;
}

export interface SystemActivity {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

