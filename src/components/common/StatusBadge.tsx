import React from 'react';
import { ComplaintStatus, ComplaintPriority } from '../../types';
import { Clock, Eye, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  switch (status) {
    case 'Pending Review':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    case 'Under Review':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses[size]}`}
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          Under Review
        </span>
      );
    case 'Needs More Information':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-purple-50 text-purple-800 border border-purple-200 ${sizeClasses[size]}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
          Needs Information
        </span>
      );
    case 'Closed (Prototype)':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          Closed (Prototype)
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-800 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'Emergency':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800 border border-red-300">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          EMERGENCY
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800 border border-orange-200">
          High Priority
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 border border-blue-200">
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
          Low
        </span>
      );
  }
};

