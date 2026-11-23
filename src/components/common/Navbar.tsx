import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  FilePlus2,
  FileText,
  BadgeAlert,
  Settings,
  RotateCcw,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    currentUser,
    loginAsRole,
    logout,
    resetDemoData,
    complaints,
    backendStatus,
    refreshBackendData,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const pendingCount = complaints.filter((c) => c.status === 'Pending Review').length;

  const handleRoleSelect = (role: UserRole) => {
    loginAsRole(role);
    setRoleDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const navigateTo = (page: string) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-police-900 text-white border-b border-police-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigateTo('landing')}
            >
              <div className="w-10 h-10 rounded-lg bg-police-700 border border-police-600 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">
                    AwaazSetu
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-police-800 text-amber-400 px-1.5 py-0.5 rounded border border-police-700 font-semibold">
                    Voice-to-FIR Prototype
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden sm:block truncate max-w-xs md:max-w-md">
                  Voice-Assisted Police Complaint & Case Tracking System
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => navigateTo('landing')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'landing'
                    ? 'bg-police-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-police-800/60'
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => navigateTo('new-complaint')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'new-complaint'
                    ? 'bg-amber-500 text-police-950 font-semibold shadow-sm'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-police-800/70'
                }`}
              >
                <FilePlus2 className="w-4 h-4" />
                <span>New Complaint</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser?.role !== 'complainant') loginAsRole('complainant');
                  else navigateTo('complainant-dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'complainant-dashboard'
                    ? 'bg-police-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-police-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Complaints</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser?.role !== 'officer') loginAsRole('officer');
                  else navigateTo('officer-dashboard');
                }}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'officer-dashboard'
                    ? 'bg-police-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-police-800/60'
                }`}
              >
                <BadgeAlert className="w-4 h-4 text-blue-400" />
                <span>Police Portal</span>
                {pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-police-950 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (currentUser?.role !== 'admin') loginAsRole('admin');
                  else navigateTo('admin-dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'admin-dashboard'
                    ? 'bg-police-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-police-800/60'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Admin</span>
              </button>
            </nav>

            {/* Right Action Tools: Backend Health Indicator, Role Switcher & Reset Demo */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Live Backend Health Indicator */}
              <button
                type="button"
                onClick={() => refreshBackendData()}
                title="Click to re-check ML Backend connection"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                    : backendStatus === 'checking'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-700/60 animate-pulse'
                    : 'bg-red-950/60 text-red-300 border-red-700/60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'connected'
                      ? 'bg-emerald-400'
                      : backendStatus === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                />
                <span>
                  {backendStatus === 'connected'
                    ? 'ML Backend Online'
                    : backendStatus === 'checking'
                    ? 'Connecting...'
                    : 'Backend Offline'}
                </span>
              </button>

              {/* Persona / Role Quick Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 bg-police-800 hover:bg-police-700/80 text-slate-200 border border-police-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="max-w-[120px] truncate">
                    {currentUser ? currentUser.name : 'Select Persona'}
                  </span>
                  <span className="text-[10px] bg-police-950/70 text-slate-300 px-1.5 py-0.5 rounded capitalize">
                    {currentUser?.role || 'Guest'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 text-slate-800 border border-slate-200">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Demo Persona
                      </p>
                    </div>
                    <button
                      onClick={() => handleRoleSelect('complainant')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        currentUser?.role === 'complainant' ? 'font-bold bg-blue-50 text-police-700' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-800">Rohan Sharma</div>
                        <div className="text-[11px] text-slate-500">Complainant (Citizen)</div>
                      </div>
                      {currentUser?.role === 'complainant' && (
                        <span className="text-[10px] text-police-600 bg-police-50 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleRoleSelect('officer')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        currentUser?.role === 'officer' ? 'font-bold bg-blue-50 text-police-700' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-800">SI Rajesh Kumar</div>
                        <div className="text-[11px] text-slate-500">Police Officer (Indiranagar)</div>
                      </div>
                      {currentUser?.role === 'officer' && (
                        <span className="text-[10px] text-police-600 bg-police-50 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleRoleSelect('admin')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        currentUser?.role === 'admin' ? 'font-bold bg-blue-50 text-police-700' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-800">System Admin</div>
                        <div className="text-[11px] text-slate-500">Platform Administrator</div>
                      </div>
                      {currentUser?.role === 'admin' && (
                        <span className="text-[10px] text-police-600 bg-police-50 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          navigateTo('login');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Sign In Screen...
                      </button>
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Demo)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Demo Data button */}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                title="Reset all demo state to defaults"
                className="p-1.5 text-slate-300 hover:text-amber-300 hover:bg-police-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px]">Reset Demo</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setShowResetModal(true)}
                className="p-1 text-slate-300 hover:text-white"
                title="Reset Demo Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-white focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-police-950 border-t border-police-800 px-4 pt-3 pb-5 space-y-2">
            <div className="p-2.5 bg-police-900 rounded-lg mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Current Persona</p>
              <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.name || 'Visitor'}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleRoleSelect('complainant')}
                  className="px-2 py-1 text-xs bg-police-800 rounded text-slate-200"
                >
                  Citizen
                </button>
                <button
                  onClick={() => handleRoleSelect('officer')}
                  className="px-2 py-1 text-xs bg-police-800 rounded text-slate-200"
                >
                  Officer
                </button>
                <button
                  onClick={() => handleRoleSelect('admin')}
                  className="px-2 py-1 text-xs bg-police-800 rounded text-slate-200"
                >
                  Admin
                </button>
              </div>
            </div>

            <button
              onClick={() => navigateTo('landing')}
              className="w-full text-left px-3 py-2 rounded text-sm text-slate-200 hover:bg-police-800"
            >
              System Overview
            </button>
            <button
              onClick={() => navigateTo('new-complaint')}
              className="w-full text-left px-3 py-2 rounded text-sm text-amber-300 hover:bg-police-800 font-medium flex items-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>File New Complaint</span>
            </button>
            <button
              onClick={() => {
                if (currentUser?.role !== 'complainant') loginAsRole('complainant');
                navigateTo('complainant-dashboard');
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-slate-200 hover:bg-police-800 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>My Complaints (Citizen)</span>
            </button>
            <button
              onClick={() => {
                if (currentUser?.role !== 'officer') loginAsRole('officer');
                navigateTo('officer-dashboard');
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-slate-200 hover:bg-police-800 flex items-center gap-2"
            >
              <BadgeAlert className="w-4 h-4" />
              <span>Police Officer Portal</span>
            </button>
            <button
              onClick={() => {
                if (currentUser?.role !== 'admin') loginAsRole('admin');
                navigateTo('admin-dashboard');
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-slate-200 hover:bg-police-800 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Administrator Screen</span>
            </button>
            <button
              onClick={() => navigateTo('login')}
              className="w-full text-left px-3 py-2 rounded text-sm text-slate-400 hover:bg-police-800"
            >
              Sign-In & Role Selection Form
            </button>
          </div>
        )}
      </header>

      {/* Confirmation Modal for Resetting Demo Data */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset Demo Data?"
        message="This will restore all sample complaints, users, officer notes, and system activity logs to their default initial states. Any simulated complaints created during this session will be reset."
        confirmLabel="Reset to Initial Data"
        cancelLabel="Keep Current Demo"
        variant="warning"
        onConfirm={resetDemoData}
        onCancel={() => setShowResetModal(false)}
      />
    </>
  );
};

