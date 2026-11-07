/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  UserCheck,
  Stethoscope,
  FlaskConical,
  ShieldCheck,
  Calendar,
  LogOut,
  Home,
  PhoneCall,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ErpBootstrapData } from './types/erp.ts';
import { initAuth, googleSignIn, logout, getIdToken } from './lib/firebase.ts';
import { HospitalLandingPage } from './components/cms/HospitalLandingPage.tsx';
import { ScrollSequenceBackground } from './components/cms/ScrollSequenceBackground.tsx';
import { SmartBookingModal } from './components/cms/SmartBookingModal.tsx';
import { DoctorEmrPortal } from './components/emr/DoctorEmrPortal.tsx';
import { PatientPortal } from './components/portals/PatientPortal.tsx';
import { LabAndPharmacyPortal } from './components/portals/LabAndPharmacyPortal.tsx';
import { AdminAndBillingPortal } from './components/portals/AdminAndBillingPortal.tsx';

type PortalView = 'PUBLIC' | 'PATIENT' | 'DOCTOR' | 'LAB_TECH' | 'SUPERADMIN';

export default function App() {
  const [activePortal, setActivePortal] = useState<PortalView>('PUBLIC');
  const [erpData, setErpData] = useState<ErpBootstrapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase Auth & Google Drive OAuth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Smart Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [bookingDeptId, setBookingDeptId] = useState<string | undefined>(undefined);
  const [bookingDoctorId, setBookingDoctorId] = useState<string | undefined>(undefined);

  const fetchErpData = useCallback(async () => {
    try {
      const idToken = getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/erp/bootstrap', { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load Anaverse Hospital ERP data');
      }
      setErpData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch ERP bootstrap data:', err);
      setError(err.message || 'Unable to connect to the Anaverse Hospital server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        if (accessToken) setDriveAccessToken(accessToken);
      },
      () => {
        setCurrentUser(null);
        setDriveAccessToken(null);
      }
    );
    fetchErpData();
    return () => unsubscribe();
  }, [fetchErpData]);

  const handleGoogleLogin = async (): Promise<string | null> => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setDriveAccessToken(result.accessToken);
        await fetchErpData();
        return result.accessToken;
      }
      return null;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setDriveAccessToken(null);
  };

  const handleOpenBooking = (deptId?: string, docId?: string) => {
    setBookingDeptId(deptId);
    setBookingDoctorId(docId);
    setBookingModalOpen(true);
  };

  const portalTabs: Array<{
    id: PortalView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'PUBLIC', label: 'Public CMS & Landing', icon: Globe },
    { id: 'PATIENT', label: 'Patient Portal (UHID)', icon: UserCheck },
    { id: 'DOCTOR', label: 'Doctor Clinical EMR', icon: Stethoscope },
    { id: 'LAB_TECH', label: 'LIS Lab, Drive Vault & IPD', icon: FlaskConical },
    { id: 'SUPERADMIN', label: 'Admin & Cashier ERP', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col relative">
      {/* Smooth Scroll 100-Frame Image Sequence Background (ezgif-frame-001.jpg to ezgif-frame-100.jpg) */}
      <ScrollSequenceBackground totalFrames={100} />

      {/* Unified Hospital ERP Role Switcher Bar (Glassmorphic) — Hidden on Mobile Devices */}
      <div className="hidden md:block relative z-40 bg-slate-950/40 backdrop-blur-xl text-white border-b border-white/15 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Role Switcher Segmented Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activePortal === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActivePortal(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Quick Smart Booking & Google Auth / Drive Vault Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenBooking()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Smart Booking</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  {currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="gsi-material-button"
              >
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 relative z-10 pb-20 md:pb-0">
        {loading && !erpData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            <div className="h-12 w-72 bg-slate-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : error && !erpData ? (
          <div className="max-w-xl mx-auto my-16 p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Anaverse Hospital System Connection Interrupted
            </h2>
            <p className="text-xs text-slate-600">{error}</p>
            <button
              type="button"
              onClick={fetchErpData}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Reload Clinical Data
            </button>
          </div>
        ) : (
          erpData && (
            <>
              {activePortal === 'PUBLIC' && (
                <HospitalLandingPage
                  departments={erpData.departments}
                  doctors={erpData.doctors}
                  onOpenBooking={handleOpenBooking}
                  onSwitchPortal={(role) => setActivePortal(role)}
                />
              )}

              {activePortal === 'PATIENT' && (
                <PatientPortal
                  patients={erpData.patients}
                  encounters={erpData.encounters}
                  labOrders={erpData.labOrders}
                  diagnosticServices={erpData.diagnosticServices}
                  medicalDocuments={erpData.medicalDocuments}
                  prescriptions={erpData.prescriptions}
                  invoices={erpData.invoices}
                  doctors={erpData.doctors}
                  onRefresh={fetchErpData}
                  onOpenBooking={() => handleOpenBooking()}
                />
              )}

              {activePortal === 'DOCTOR' && (
                <DoctorEmrPortal
                  doctors={erpData.doctors}
                  patients={erpData.patients}
                  appointments={erpData.appointments}
                  encounters={erpData.encounters}
                  diagnosticServices={erpData.diagnosticServices}
                  labOrders={erpData.labOrders}
                  prescriptions={erpData.prescriptions}
                  pharmacyInventory={erpData.pharmacyInventory}
                  onRefresh={fetchErpData}
                />
              )}

              {activePortal === 'LAB_TECH' && (
                <LabAndPharmacyPortal
                  labOrders={erpData.labOrders}
                  diagnosticServices={erpData.diagnosticServices}
                  medicalDocuments={erpData.medicalDocuments}
                  prescriptions={erpData.prescriptions}
                  pharmacyInventory={erpData.pharmacyInventory}
                  beds={erpData.beds}
                  patients={erpData.patients}
                  encounters={erpData.encounters}
                  doctors={erpData.doctors}
                  accessToken={driveAccessToken}
                  onGoogleLogin={handleGoogleLogin}
                  onRefresh={fetchErpData}
                />
              )}

              {activePortal === 'SUPERADMIN' && (
                <AdminAndBillingPortal
                  beds={erpData.beds}
                  labOrders={erpData.labOrders}
                  invoices={erpData.invoices}
                  invoiceItems={erpData.invoiceItems}
                  patients={erpData.patients}
                  auditLogs={erpData.auditLogs}
                  onRefresh={fetchErpData}
                />
              )}
            </>
          )
        )}
      </main>

      {/* 5-Item Sticky Bottom Navigation Bar for Mobile Users (Strictly within <= 15% Mobile Viewport Height Cap) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/92 backdrop-blur-2xl border-t border-white/20 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] px-3 py-1.5"
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => {
              setActivePortal('PUBLIC');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-[11px] font-semibold transition-all active:scale-95 ${
              activePortal === 'PUBLIC' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </button>

          {/* 2. Doctors / Specialists */}
          <button
            type="button"
            onClick={() => {
              if (activePortal !== 'PUBLIC') {
                setActivePortal('PUBLIC');
                setTimeout(() => {
                  const el = document.getElementById('doctors');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                const el = document.getElementById('doctors');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-[11px] font-semibold text-slate-400 hover:text-white active:scale-95 transition-all"
          >
            <Stethoscope className="w-5 h-5 mb-0.5" />
            <span>Doctors</span>
          </button>

          {/* 3. CENTER ELEVATED ACTION: Book Visit CTA */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-4 px-1">
            <button
              type="button"
              onClick={() => handleOpenBooking()}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-blue-600/50 border-2 border-white/40 transition-all min-w-[48px] min-h-[48px]"
              aria-label="Book Specialist Appointment"
            >
              <Calendar className="w-6 h-6 text-white" />
            </button>
            <span className="text-[10px] font-extrabold text-sky-300 mt-0.5 tracking-tight">
              Book Visit
            </span>
          </div>

          {/* 4. Patient Portal / UHID */}
          <button
            type="button"
            onClick={() => setActivePortal('PATIENT')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-[11px] font-semibold transition-all active:scale-95 ${
              activePortal === 'PATIENT' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-5 h-5 mb-0.5" />
            <span>My Health</span>
          </button>

          {/* 5. 24/7 ER Hotline */}
          <a
            href="tel:02112345678"
            className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 active:scale-95 transition-all"
            aria-label="Call 24/7 Emergency ER"
          >
            <PhoneCall className="w-5 h-5 mb-0.5 animate-pulse text-rose-500" />
            <span>Call ER</span>
          </a>
        </div>
      </nav>

      {/* Global 5-Step Smart Booking Engine Modal */}
      {erpData && (
        <SmartBookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          departments={erpData.departments}
          doctors={erpData.doctors}
          patients={erpData.patients}
          initialDepartmentId={bookingDeptId}
          initialDoctorId={bookingDoctorId}
          onBookingSuccess={fetchErpData}
          onNavigateToDoctorQueue={() => setActivePortal('DOCTOR')}
        />
      )}
    </div>
  );
}
