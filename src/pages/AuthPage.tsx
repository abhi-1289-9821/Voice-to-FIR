import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  User,
  BadgeAlert,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { loginAsRole, addToast, setActivePage } = useApp();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('complainant');

  // Form fields
  const [email, setEmail] = useState('rohan.sharma.demo@example.com');
  const [password, setPassword] = useState('demo-password-123');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('Rohan Sharma');
  const [badgeNumber, setBadgeNumber] = useState('KA-BPS-4891');
  const [station, setStation] = useState('Indiranagar Police Station');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickPersona = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'complainant') {
      setEmail('rohan.sharma.demo@example.com');
      setName('Rohan Sharma');
    } else if (role === 'officer') {
      setEmail('rajesh.kumar.bcp@karnataka.gov.demo');
      setName('Sub-Inspector Rajesh Kumar');
      setBadgeNumber('KA-BPS-4891');
      setStation('Indiranagar Police Station');
    } else {
      setEmail('admin.awaazsetu@gov.demo');
      setName('System Admin');
    }
    setErrors({});
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      errs.password = 'Password is required for demo sign-in';
    } else if (password.length < 6) {
      errs.password = 'Demo password must be at least 6 characters';
    }

    if (activeTab === 'register') {
      if (!name.trim()) errs.name = 'Full name is required';
      if (selectedRole === 'officer' && !badgeNumber.trim()) {
        errs.badgeNumber = 'Police Badge / ID Number is required for officer registration';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Validation Error', 'Please check the marked fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      loginAsRole(selectedRole);
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-police-900 text-amber-400 items-center justify-center shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            AwaazSetu Portal Access
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Voice-to-FIR System — Simulated Authentication for Demo
          </p>
        </div>

        {/* Demo Notice Banner */}
        <div className="mt-4 mx-4 sm:mx-0 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Phase 1 Mock Authentication:</strong> No credentials are sent to a server. 
            Select any persona below to quickly inspect the respective dashboard.
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-200">
          {/* Quick Persona Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Select Demo Persona (1-Click)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPersona('complainant')}
                className={`p-2.5 rounded-lg border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                  selectedRole === 'complainant'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <User className="w-4 h-4 text-amber-600" />
                <span>Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('officer')}
                className={`p-2.5 rounded-lg border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                  selectedRole === 'officer'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <BadgeAlert className="w-4 h-4 text-blue-600" />
                <span>Officer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('admin')}
                className={`p-2.5 rounded-lg border text-xs text-center flex flex-col items-center gap-1 transition-all ${
                  selectedRole === 'admin'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold ring-1 ring-purple-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher: Sign In vs Register */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setActiveTab('signin');
                setErrors({});
              }}
              className={`pb-2.5 text-xs font-semibold flex-1 text-center transition-colors ${
                activeTab === 'signin'
                  ? 'border-b-2 border-police-800 text-police-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In (Demo)
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrors({});
              }}
              className={`pb-2.5 text-xs font-semibold flex-1 text-center transition-colors ${
                activeTab === 'register'
                  ? 'border-b-2 border-police-800 text-police-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register New Account (Demo)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none border-slate-300"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address / Official ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none border-slate-300"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
            </div>

            {selectedRole === 'officer' && activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Police Badge / Service ID
                  </label>
                  <div className="relative">
                    <BadgeAlert className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="e.g. KA-BPS-4891"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none border-slate-300"
                    />
                  </div>
                  {errors.badgeNumber && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.badgeNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assigned Police Station
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      placeholder="e.g. Indiranagar Police Station"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none border-slate-300"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password (Demo)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-police-500 focus:outline-none border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 rounded text-police-600 focus:ring-police-500 mr-2"
                />
                Remember persona in browser
              </label>
              <span className="text-slate-400">Demo sandbox</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-2.5 px-4 bg-police-800 hover:bg-police-900 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {activeTab === 'signin' ? `Sign In as ${selectedRole}` : `Create ${selectedRole} Account`}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Quick cancel back to landing */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setActivePage('landing')}
              className="text-xs text-slate-500 hover:text-police-700 underline"
            >
              Return to landing page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
