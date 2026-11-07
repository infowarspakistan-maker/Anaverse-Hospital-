import React, { useState } from 'react';
import {
  Heart,
  Calendar,
  Users,
  BedDouble,
  Award,
  Clock,
  ShieldCheck,
  Building2,
  Stethoscope,
  Ambulance,
  Scan,
  Microscope,
  Pill,
  PhoneCall,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
  Activity,
  Home,
  UserCheck,
  AlertCircle,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Department, Doctor } from '../../types/erp.ts';
import { ReferencePhoto, ReferenceCropKey } from '../common/ReferencePhoto.tsx';

interface HospitalLandingPageProps {
  departments: Department[];
  doctors: Doctor[];
  onOpenBooking: (deptId?: string, docId?: string) => void;
  onSwitchPortal: (role: 'PATIENT' | 'DOCTOR' | 'LAB_TECH' | 'SUPERADMIN') => void;
}

interface ArticleItem {
  id: string;
  category: string;
  title: string;
  date: string;
  readTime: string;
  cropKey: ReferenceCropKey;
  summary: string;
  clinicalTakeaways: string[];
}

export const HospitalLandingPage: React.FC<HospitalLandingPageProps> = ({
  departments,
  doctors,
  onOpenBooking,
  onSwitchPortal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('ALL');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('poli');
  const [activeArticle, setActiveArticle] = useState<ArticleItem | null>(null);

  const stats = [
    { id: 1, icon: Users, value: '15+', label: 'Specialist Doctors' },
    { id: 2, icon: Heart, value: '25,000+', label: 'Patients Served' },
    { id: 3, icon: BedDouble, value: '120+', label: 'Inpatient Rooms' },
    { id: 4, icon: Award, value: '98%', label: 'Patient Satisfaction' },
  ];

  const serviceCards: Array<{
    id: string;
    deptId: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    cropKey: ReferenceCropKey;
    tag: string;
    wait: string;
    badgeColor: string;
    location: string;
    keyFeature: string;
    imageUrl: string;
  }> = [
    {
      id: 'poli',
      deptId: 'd1111111-1111-1111-1111-111111111111',
      name: 'Specialist Clinics',
      icon: Stethoscope,
      cropKey: 'service-poli',
      tag: 'Specialist OPD',
      wait: '~10m wait',
      badgeColor: 'bg-blue-600 text-white',
      location: 'Wing A · Level 2',
      keyFeature: 'Board Cardiologists, Pediatricians, Surgeons & Internists with direct OPD queue tokens.',
      imageUrl: '/services/specialist-clinics.jpg',
    },
    {
      id: 'inap',
      deptId: 'd2222222-2222-2222-2222-222222222222',
      name: 'Inpatient Care',
      icon: BedDouble,
      cropKey: 'service-inap',
      tag: 'Executive Suites',
      wait: 'Beds Available',
      badgeColor: 'bg-indigo-600 text-white',
      location: 'Central Tower · Fl. 3–7',
      keyFeature: 'Luxury VIP Suites, telemetry telemetry monitoring and 24/7 compassionate clinical nursing.',
      imageUrl: '/services/inpatient-care.jpg',
    },
    {
      id: 'igd',
      deptId: 'd3333333-3333-3333-3333-333333333333',
      name: '24/7 Emergency (ER)',
      icon: Ambulance,
      cropKey: 'service-igd',
      tag: '24/7 Red Code',
      wait: 'Zero-Wait Triage',
      badgeColor: 'bg-rose-600 text-white',
      location: 'Ground Level · Ambulance Bay',
      keyFeature: 'Immediate life-support trauma resuscitation, acute cardiac shock team, and 24/7 standby.',
      imageUrl: '/services/emergency-er.jpg',
    },
    {
      id: 'radiologi',
      deptId: 'd4444444-4444-4444-4444-444444444444',
      name: 'Radiology & Imaging',
      icon: Scan,
      cropKey: 'service-radiologi',
      tag: 'Digital Imaging',
      wait: '~15m scan',
      badgeColor: 'bg-emerald-600 text-white',
      location: 'Diagnostic Wing · B1',
      keyFeature: '1.5T Superconducting MRI, 128-Slice High-Resolution CT, 4D Ultrasound, and digital X-ray.',
      imageUrl: '/services/radiology-imaging.jpg',
    },
    {
      id: 'lab',
      deptId: 'd5555555-5555-5555-5555-555555555555',
      name: 'Clinical Laboratory',
      icon: Microscope,
      cropKey: 'service-lab',
      tag: 'Robotic LIS',
      wait: 'Same-Day PDF',
      badgeColor: 'bg-amber-600 text-white',
      location: 'Diagnostic Wing · Level 1',
      keyFeature: 'Automated clinical pathology, hematology, biochemistry, and instant Drive EMR archiving.',
      imageUrl: '/services/clinical-laboratory.jpg',
    },
    {
      id: 'farmasi',
      deptId: 'd6666666-6666-6666-6666-666666666666',
      name: 'Hospital Pharmacy',
      icon: Pill,
      cropKey: 'service-farmasi',
      tag: 'Clinical eRx',
      wait: '~5m dispense',
      badgeColor: 'bg-cyan-600 text-white',
      location: 'Main Lobby · Counter 4',
      keyFeature: '24/7 certified formulary, automated e-Prescription dispensing, and barcoded safety verification.',
      imageUrl: '/services/hospital-pharmacy.jpg',
    },
  ];

  const facilities: Array<{
    name: string;
    cropKey: ReferenceCropKey;
    spec: string;
    image?: string;
  }> = [
    {
      name: 'Modern Hospital Lobby',
      cropKey: 'building-exterior',
      image: '/Entering_modern_hospital_lobby_45d68bc6.gif',
      spec: 'Digital Concierge, Smart Queue Terminals & Executive Lounge',
    },
    {
      name: 'Intensive Care Unit (ICU)',
      cropKey: 'fac-icu',
      spec: '24/7 Multiparameter Telemetry & Mechanical Ventilation',
    },
    {
      name: 'VIP Inpatient Suites',
      cropKey: 'fac-vip',
      spec: 'Executive Recovery Suites & Smart Nurse Call System',
    },
    {
      name: 'Operating Theaters',
      cropKey: 'fac-operasi',
      spec: 'HEPA-Filtered Sterile Surgical Suites & Laparoscopy',
    },
    {
      name: 'Clinical Laboratory',
      cropKey: 'fac-lab',
      spec: 'Automated Clinical Pathology & Cloud PDF Archiving',
    },
    {
      name: '24/7 Ambulance Fleet',
      cropKey: 'fac-ambulans',
      spec: 'Mobile Emergency Life Support & Defibrillator Units',
    },
  ];

  const articles: ArticleItem[] = [
    {
      id: 'art-1',
      category: 'Heart Health',
      title: 'Essential Daily Habits for Cardiovascular Health',
      date: 'May 20, 2026',
      readTime: '4 min read',
      cropKey: 'news-jantung',
      summary:
        'Cardiovascular conditions often progress silently without early warning signs. Routine blood pressure monitoring and periodic lipid profiling help prevent coronary complications.',
      clinicalTakeaways: [
        'Maintain optimal blood pressure below 120/80 mmHg with a low-sodium DASH diet.',
        'Complete at least 150 minutes of moderate-intensity aerobic exercise every week.',
        'Check your fasting lipid profile (LDL, HDL, Triglycerides) every 6–12 months at Anaverse Laboratory.',
      ],
    },
    {
      id: 'art-2',
      category: 'Pediatrics',
      title: 'The Importance of Early Childhood Immunization',
      date: 'May 18, 2026',
      readTime: '3 min read',
      cropKey: 'news-anak',
      summary:
        'Completing the primary pediatric immunization schedule protects infants and children against severe infectious diseases while strengthening long-term immunity.',
      clinicalTakeaways: [
        'Follow the recommended pediatric vaccination timeline from birth through school age.',
        'Schedule regular growth and developmental milestone screenings with a Pediatrician.',
        'Track digital immunization records directly inside the Anaverse Patient Portal.',
      ],
    },
    {
      id: 'art-3',
      category: 'Healthy Lifestyle',
      title: 'Balanced Nutrition for Optimal Metabolic Wellness',
      date: 'May 16, 2026',
      readTime: '5 min read',
      cropKey: 'news-gaya-hidup',
      summary:
        'A nutrient-dense diet rich in soluble fiber, lean proteins, and natural antioxidants plays a direct role in stabilizing blood glucose and cardiometabolic health.',
      clinicalTakeaways: [
        'Apply the balanced plate method: 50% vegetables and fruits, 25% lean protein, 25% whole grains.',
        'Minimize refined sugars and processed trans fats.',
        'Maintain adequate daily hydration of at least 2 liters of water.',
      ],
    },
    {
      id: 'art-4',
      category: 'Senior Care',
      title: 'Comprehensive Geriatric Care for Your Loved Ones',
      date: 'May 14, 2026',
      readTime: '4 min read',
      cropKey: 'news-lansia',
      summary:
        'An integrated geriatric care model ensures older adults receive safe medication management, fall-risk prevention, and compassionate family-centered support.',
      clinicalTakeaways: [
        'Review routine medications (polypharmacy) with an Internal Medicine Specialist.',
        'Monitor renal function, bone mineral density, and orthostatic blood pressure.',
        'Use the Active Medication Tracker in the Anaverse Patient Portal for timely refills.',
      ],
    },
  ];

  const getDoctorGif = (doc: Doctor, index: number = 0): string => {
    const lower = (doc.fullName || '').toLowerCase();
    if (lower.includes('andika')) return "/Doctor_adjusts_posture_in_hallway_2cab1d82.gif";
    if (lower.includes('salsabila')) return "/Female_doctor_in_hospital_hallway_1e6c454b.gif";
    if (lower.includes('budi')) return "/Healthcare_worker_adjusts_stance_7374fd6f.gif";
    if (lower.includes('meilani')) return "/Healthcare_worker_smiles_in_hallway_6854f5a2.gif";
    if (lower.includes('dewi') || lower.includes('sarah') || index === 4) return "/Nurse_adjusting_stance_in_hallway_68f22ae3.gif";
    if (lower.includes('rudi') || lower.includes('hartono') || index === 5) return "/Nurse_smiles_in_hospital_hallway_203d1401.gif";
    const all = [
      "/Doctor_adjusts_posture_in_hallway_2cab1d82.gif",
      "/Female_doctor_in_hospital_hallway_1e6c454b.gif",
      "/Healthcare_worker_adjusts_stance_7374fd6f.gif",
      "/Healthcare_worker_smiles_in_hallway_6854f5a2.gif",
      "/Nurse_adjusting_stance_in_hallway_68f22ae3.gif",
      "/Nurse_smiles_in_hospital_hallway_203d1401.gif",
    ];
    return all[index % all.length];
  };

  const getDoctorCropKey = (doc: Doctor): ReferenceCropKey => {
    const lower = doc.fullName.toLowerCase();
    if (lower.includes('andika')) return 'doc-andika';
    if (lower.includes('salsabila')) return 'doc-salsabila';
    if (lower.includes('budi')) return 'doc-budi';
    return 'doc-meilani';
  };

  const filteredDoctors =
    selectedSpecialtyFilter === 'ALL'
      ? doctors
      : doctors.filter((d) =>
          d.specializationTitle.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase())
        );

  return (
    <div className="min-h-screen bg-transparent text-white font-sans antialiased selection:bg-blue-500 selection:text-white relative z-10">
      {/* 1. TOP NAVBAR — Pure Glassmorphism over Smooth Scroll Sequence */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#home"
            className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 drop-shadow-sm"
          >
            ANAVERSE HOSPITAL
          </a>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
            <a
              href="#home"
              className="text-white font-semibold border-b-2 border-sky-400 pb-1 whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#about"
              className="hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              About Us
            </a>
            <a
              href="#services"
              className="hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#doctors"
              className="hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              Doctors
            </a>
            <a
              href="#facilities"
              className="hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              Facilities
            </a>
          </nav>

          {/* Zone 3: Primary Action & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop "Book Online" CTA */}
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600/85 hover:bg-blue-500 backdrop-blur-md border border-white/30 text-white text-sm font-semibold shadow-lg transition-colors whitespace-nowrap shrink-0 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Online</span>
            </button>

            {/* Mobile-Visible "Book Visit" CTA in sticky header */}
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold border border-white/30 shadow-md transition-all shrink-0 min-h-[40px]"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-200" />
              <span>Book Visit</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/15 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center border border-white/15"
              aria-label="Navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Glass Dropdown with touch-friendly targets and portal links */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/20 bg-slate-950/92 backdrop-blur-2xl px-5 pt-3 pb-6 space-y-3 shadow-2xl">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/15">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/10 text-sky-300 font-semibold text-xs active:scale-95 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/5 text-white/90 font-medium text-xs active:scale-95 transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>About Us</span>
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/5 text-white/90 font-medium text-xs active:scale-95 transition-all"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Services</span>
              </a>
              <a
                href="#doctors"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/5 text-white/90 font-medium text-xs active:scale-95 transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Doctors</span>
              </a>
              <a
                href="#facilities"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/5 text-white/90 font-medium text-xs active:scale-95 transition-all"
              >
                <BedDouble className="w-4 h-4" />
                <span>Facilities</span>
              </a>
              <a
                href="#news"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/5 text-white/90 font-medium text-xs active:scale-95 transition-all"
              >
                <Activity className="w-4 h-4" />
                <span>Health News</span>
              </a>
            </div>

            {/* Prominent Mobile Booking CTA */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="flex items-center justify-center gap-2 w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 border border-white/30 text-white font-bold text-sm shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Doctor Appointment</span>
            </button>

            {/* Quick Portals Switcher on Mobile Drawer */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Hospital Portals
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSwitchPortal('PATIENT');
                  }}
                  className="min-h-[44px] px-3 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-left text-white font-medium flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <span>Patient UHID</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSwitchPortal('DOCTOR');
                  }}
                  className="min-h-[44px] px-3 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-left text-white font-medium flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <span>Doctor EMR</span>
                </button>
              </div>
            </div>

            {/* 24/7 Emergency Quick Dial */}
            <a
              href="tel:02112345678"
              className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-rose-600/90 active:scale-95 text-white font-bold text-xs border border-rose-400/30"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Emergency 24/7 Hotline: (021) 1234 5678</span>
            </a>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION — Transparent, Section Background Removed */}
      <section id="home" className="relative pt-6 sm:pt-10 pb-10 sm:pb-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              {/* Left Content */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-6">
                {/* Important Items First: 24/7 ER Hotline & Live Outpatient Wait Times */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-0 bg-transparent border-0 text-xs shadow-none">
                  <a
                    href="tel:02112345678"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold tracking-wide transition-all shrink-0 min-h-[34px]"
                  >
                    <Ambulance className="w-4 h-4 animate-pulse" />
                    <span>24/7 ER: (021) 1234 5678</span>
                  </a>
                  <div className="flex items-center gap-1.5 text-sky-200 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span className="text-[11px] sm:text-xs">Live OPD Wait: ~8 min</span>
                  </div>
                  <div className="hidden sm:inline text-white/50">|</div>
                  <div className="hidden sm:inline text-[11px] sm:text-xs text-white/80">
                    JCI Accredited Hospital
                  </div>
                </div>

                {/* Breadcrumb / Overline — Hidden on Mobile Devices */}
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-sky-300 tracking-wide">
                  <Heart className="w-4 h-4 fill-sky-400 text-sky-400 shrink-0" />
                  <span>Your Health, Our Highest Priority</span>
                </div>

                <h1
                  className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-white leading-[1.14] tracking-tight drop-shadow-sm"
                  style={{ textWrap: 'balance' }}
                >
                  World-Class Care for Your{' '}
                  <span className="text-sky-300">Health</span> and Family
                </h1>

                {/* Subheading — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-sm sm:text-base text-white/85 leading-relaxed max-w-lg">
                  We deliver accredited medical services, board-certified specialist doctors, and
                  modern diagnostic facilities for comprehensive patient care.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenBooking()}
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 backdrop-blur-md border border-white/30 text-white font-bold text-sm shadow-xl transition-all"
                  >
                    <Calendar className="w-4 h-4 text-sky-200" />
                    <span>Book Specialist Appointment</span>
                  </button>
                  <a
                    href="#services"
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/30 text-white font-semibold text-sm transition-all"
                  >
                    <span>Explore Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Right Hero Image Card — Replaced with Doctor Holding Child Hand Animated GIF */}
              <div className="lg:col-span-6 flex items-center">
                <div className="relative rounded-2xl overflow-hidden border border-white/30 shadow-xl aspect-[16/10] sm:aspect-[4/3] lg:aspect-auto lg:h-full min-h-[200px] sm:min-h-[360px] w-full bg-slate-900/60">
                  <img
                    src="/Doctor_holding_child's_hand_32be3aaf.gif"
                    alt="Doctor holding child's hand"
                    className="w-full h-full object-cover block"
                  />
                </div>
              </div>
            </div>

            {/* Full-Width Key Performance Stats Bar — Clean Background Removed */}
            <div className="mt-4 sm:mt-8 bg-transparent sm:bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border-0 sm:border sm:border-white/25 p-1 sm:p-5 lg:p-6">
              <div className="grid grid-cols-4 gap-1 sm:gap-4 lg:gap-8">
                {stats.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 p-1 rounded-lg">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-sky-300 shrink-0">
                      <item.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-xs sm:text-lg lg:text-2xl font-extrabold text-white tracking-tight tabular-nums">
                        {item.value}
                      </div>
                      <div className="text-[9px] sm:text-xs font-medium text-white/80 line-clamp-1">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT SECTION ("About Us") — Transparent, Section Background Removed */}
      <section id="about" className="py-8 sm:py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Hospital Entrance / Modern Lobby Walkthrough Animation */}
              <div className="lg:col-span-6 flex items-center">
                <div className="rounded-2xl overflow-hidden border border-white/30 relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-auto lg:h-full min-h-[200px] sm:min-h-[360px] w-full group shadow-2xl bg-slate-900">
                  <img
                    src="/Entering_modern_hospital_lobby_45d68bc6.gif"
                    alt="Entering Modern Hospital Lobby — Anaverse Hospital"
                    className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-slate-950/75 backdrop-blur-xl px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-white border border-white/25 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Entering Modern Hospital Lobby — Anaverse Hospital</span>
                  </div>
                </div>
              </div>

              {/* Information & 4 Pillar Features */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-6">
                {/* Breadcrumb / Category Trail — Hidden on Mobile Devices */}
                <div className="hidden sm:block text-xs font-bold text-sky-300 tracking-wide">
                  About Us · Integrated Medical Center
                </div>
                <h2
                  className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  <span className="text-sky-300">Anaverse</span> Hospital for a Healthier Tomorrow
                </h2>
                {/* Subheading / Description — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-sm sm:text-base text-white/85 leading-relaxed">
                  Anaverse Hospital is committed to delivering compassionate clinical excellence
                  backed by modern Electronic Medical Records (EMR), automated laboratory diagnostics,
                  and a healing inpatient environment.
                </p>

                {/* 4 Feature Grid (Glassmorphic Sub-Panels) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  <div className="p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <Clock className="w-5 h-5 text-sky-300 mb-2" />
                    <h3 className="text-xs font-bold text-white">24/7 Emergency</h3>
                    <p className="text-[11px] text-white/75 mt-0.5">Always ready every day</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <ShieldCheck className="w-5 h-5 text-sky-300 mb-2" />
                    <h3 className="text-xs font-bold text-white">Board-Certified</h3>
                    <p className="text-[11px] text-white/75 mt-0.5">Experienced specialists</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <Building2 className="w-5 h-5 text-sky-300 mb-2" />
                    <h3 className="text-xs font-bold text-white">Modern Facilities</h3>
                    <p className="text-[11px] text-white/75 mt-0.5">Advanced diagnostic tech</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <Heart className="w-5 h-5 text-sky-300 mb-2" />
                    <h3 className="text-xs font-bold text-white">Patient-Centered</h3>
                    <p className="text-[11px] text-white/75 mt-0.5">Compassionate care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICES SECTION ("Our Services") — Transparent, Section Background Removed */}
      <section id="services" className="py-8 sm:py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Our Medical Services
                </h2>
                {/* Subheading — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1">
                  Select a clinical department to book an outpatient consultation or diagnostic test
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenBooking()}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-300 hover:text-white whitespace-nowrap shrink-0 min-h-[36px]"
              >
                <span>View All Services</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Visual Department & Service Spotlight Banner */}
            {(() => {
              const activeService =
                serviceCards.find((s) => s.id === selectedServiceId) || serviceCards[0];
              const activeDept = departments.find((d) => d.id === activeService.deptId);
              const ActiveIcon = activeService.icon;

              return (
                <div className="mb-6 rounded-2xl overflow-hidden bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl transition-all">
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    {/* Left: Wide Visual Department Photograph */}
                    <div className="lg:col-span-6 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[200px] sm:min-h-[260px] overflow-hidden bg-slate-900">
                      <img
                        src={activeService.imageUrl}
                        alt={activeService.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent lg:hidden" />

                      {/* Floating Status Badges */}
                      <span
                        className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg shadow-md ${activeService.badgeColor}`}
                      >
                        {activeService.tag}
                      </span>
                      <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-sky-200 border border-white/20">
                        ⚡ {activeService.wait}
                      </span>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                          <ActiveIcon className="w-5 h-5 text-sky-300" />
                          <span>{activeDept?.name || activeService.name}</span>
                        </div>
                        <div className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-300" />
                          <span>{activeService.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Visual Quick Reference & 1-Tap Booking */}
                    <div className="lg:col-span-6 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Visual Clinical Spotlight</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                          {activeDept?.name || activeService.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/85 font-medium mt-1 leading-relaxed">
                          {activeService.keyFeature}
                        </p>

                        {/* 4 Quick Visual Cue Cards */}
                        <div className="grid grid-cols-2 gap-2 pt-3">
                          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                            <span className="text-white/60 text-[10px] font-semibold block">Queue Status</span>
                            <span className="text-sky-300 font-bold text-xs">{activeService.wait}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                            <span className="text-white/60 text-[10px] font-semibold block">Location</span>
                            <span className="text-white font-bold text-xs truncate block">{activeService.location}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                            <span className="text-white/60 text-[10px] font-semibold block">Physicians</span>
                            <span className="text-emerald-300 font-bold text-xs">Board Specialists</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                            <span className="text-white/60 text-[10px] font-semibold block">Token Type</span>
                            <span className="text-amber-300 font-bold text-xs">Instant UHID Queue</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenBooking(activeService.deptId)}
                          className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all border border-white/30"
                        >
                          <Calendar className="w-4 h-4 text-sky-200" />
                          <span>Book {activeDept?.name || activeService.name} Token</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenBooking(activeService.deptId)}
                          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>Explore Roster</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 6 Visual Service & Department Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {serviceCards.map((item) => {
                const dept = departments.find((d) => d.id === item.deptId);
                const isSelected = selectedServiceId === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedServiceId(item.id);
                    }}
                    onDoubleClick={() => onOpenBooking(item.deptId)}
                    className={`rounded-2xl p-2.5 sm:p-3 border transition-all group flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md ${
                      isSelected
                        ? 'bg-blue-600/30 border-sky-400 ring-2 ring-sky-400/50 shadow-lg scale-[1.02]'
                        : 'bg-white/10 hover:bg-white/20 border-white/25 hover:border-sky-300'
                    }`}
                  >
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5 border border-white/20 relative bg-slate-900">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-sky-200 border border-white/20">
                        {item.wait}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md text-sky-300 flex items-center justify-center -mt-6 mb-1.5 border border-white/30 shadow-sm">
                      <item.icon className="w-3.5 h-3.5" />
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors truncate w-full">
                      {dept?.name || item.name}
                    </span>
                    <span className="text-[10px] text-sky-300/90 mt-0.5 font-semibold">
                      {item.tag}
                    </span>
                    <span className="text-[9px] text-white/60 mt-1 flex items-center gap-1 group-hover:text-white">
                      <span>View Wing</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. DOCTORS DIRECTORY ("Our Doctors") — Transparent, Section Background Removed */}
      <section id="doctors" className="py-8 sm:py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
              <div>
                {/* Breadcrumb / Category Trail — Hidden on Mobile Devices */}
                <div className="hidden sm:block text-xs font-bold text-sky-300 mb-1">
                  Our Doctors · Active Specialist Directory
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Experienced Specialist Physicians
                </h2>
                {/* Subheading — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
                  Our medical specialists are ready to provide personalized care for you and your
                  family. Select a physician to schedule an immediate consultation.
                </p>
              </div>

              {/* Interactive Specialty Filter Controls (Smooth Touch Scroll on Mobile) */}
              <div className="flex items-center gap-1.5 p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-x-auto max-w-full">
                {[
                  { key: 'ALL', label: 'All Specialists' },
                  { key: 'Cardiologist', label: 'Cardiology' },
                  { key: 'Pediatrician', label: 'Pediatrics' },
                  { key: 'Surgeon', label: 'Surgery' },
                  { key: 'Internal Medicine', label: 'Internal Medicine' },
                  { key: 'Neurologist', label: 'Neurology' },
                  { key: 'Anesthesiologist', label: 'Critical Care' },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    onClick={() => setSelectedSpecialtyFilter(tab.key)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[38px] active:scale-95 ${
                      selectedSpecialtyFilter === tab.key
                        ? 'bg-blue-600 text-white border border-white/30 shadow-md font-bold'
                        : 'text-white/75 hover:text-white bg-white/5 sm:bg-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              {filteredDoctors.map((doc, index) => (
                <div
                  key={doc.id}
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 sm:border-white/25 overflow-hidden flex flex-col justify-between group transition-all shadow-md"
                >
                  <div>
                    <div className="w-full aspect-[4/5] overflow-hidden border-b border-white/15 bg-slate-900/60 relative">
                      <img
                        src={getDoctorGif(doc, index)}
                        alt={doc.fullName}
                        className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/75 backdrop-blur-sm text-sky-200 border border-white/20 truncate max-w-[85%] shadow-sm">
                        {doc.specializationTitle}
                      </span>
                    </div>
                    <div className="p-2 sm:p-4 text-center space-y-0.5 sm:space-y-1">
                      <h3 className="text-xs sm:text-base font-bold sm:font-extrabold text-white truncate" title={doc.fullName}>
                        {doc.fullName}
                      </h3>
                      <p className="text-[10px] sm:text-xs font-medium text-white/80 truncate" title={doc.specializationTitle}>
                        {doc.specializationTitle}
                      </p>
                      <div className="text-[9px] sm:text-xs text-amber-300 font-semibold truncate">
                        ★ {doc.rating} <span className="hidden sm:inline text-white/60">({doc.reviewCount})</span>
                      </div>
                      <p className="text-[10px] sm:text-xs font-mono tabular-nums text-sky-300 font-bold truncate">
                        <span className="hidden sm:inline">IDR </span>{Number(doc.consultationFee).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="px-1.5 pb-2 sm:px-4 sm:pb-4">
                    <button
                      type="button"
                      onClick={() => onOpenBooking(doc.departmentId, doc.id)}
                      className="w-full min-h-[34px] sm:min-h-[44px] py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl bg-blue-600/90 hover:bg-blue-500 active:scale-95 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center"
                    >
                      <span className="sm:hidden">Book</span>
                      <span className="hidden sm:inline">Book Consultation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FACILITIES SHOWCASE — Transparent, Section Background Removed */}
      <section id="facilities" className="py-8 sm:py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Modern Facilities for Superior Recovery
                </h2>
                {/* Subheading — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1">
                  Advanced clinical infrastructure and healing environments designed for patient safety.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSwitchPortal('LAB_TECH')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
              >
                <span>Open Inpatient Wards & LIS Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {facilities.map((fac) => (
                <div
                  key={fac.name}
                  onClick={() => onSwitchPortal('LAB_TECH')}
                  className="rounded-2xl overflow-hidden bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/25 transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-full aspect-[16/10] overflow-hidden border-b border-white/15 relative bg-slate-900">
                    {fac.image ? (
                      <img
                        src={fac.image}
                        alt={fac.name}
                        className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <ReferencePhoto cropKey={fac.cropKey} className="w-full h-full" />
                    )}
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-slate-950/75 backdrop-blur-sm text-sky-200 border border-white/20">
                      {fac.name}
                    </span>
                  </div>
                  <div className="p-3 sm:p-3.5 text-center">
                    <span className="text-xs font-bold text-white block">{fac.name}</span>
                    <span className="text-[10px] sm:text-[11px] text-white/75 mt-0.5 block line-clamp-1">
                      {fac.spec}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. HEALTH NEWS & TIPS ("Health News & Tips") — Transparent, Section Background Removed */}
      <section id="news" className="py-8 sm:py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="flex items-center justify-between gap-3 mb-6 sm:mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Health News & Medical Tips
                </h2>
                {/* Subheading — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1">
                  Evidence-based clinical insights and wellness guides from Anaverse Hospital specialists
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(articles[0])}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-300 hover:text-white whitespace-nowrap shrink-0 min-h-[36px]"
              >
                <span>View All Articles</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {articles.map((item) => (
                <article
                  key={item.id}
                  onClick={() => setActiveArticle(item)}
                  className="rounded-2xl border border-white/25 overflow-hidden hover:border-sky-300 active:scale-95 transition-all cursor-pointer group flex flex-col justify-between bg-white/10 hover:bg-white/20 backdrop-blur-md"
                >
                  <div>
                    <div className="w-full aspect-[16/10] overflow-hidden border-b border-white/15">
                      <ReferencePhoto cropKey={item.cropKey} className="w-full h-full" />
                    </div>
                    <div className="p-4">
                      {/* Zero-Pill Metadata Discipline: Clean unboxed text with · separator */}
                      <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold mb-1.5">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-white/75 font-normal">{item.readTime}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-1 flex items-center justify-between text-xs text-white/75">
                    <span>{item.date}</span>
                    <span className="font-semibold text-sky-300">Read Article →</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. EMERGENCY CTA CARD ("Need Urgent Medical Assistance?") — Transparent, Section Background Removed */}
      <section className="py-8 sm:py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-transparent border-0 p-0 shadow-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Need Urgent Medical Assistance?
                </h3>
                {/* Subheading — Hidden on Mobile Devices */}
                <p className="hidden sm:block text-xs sm:text-sm text-white/85 max-w-lg">
                  Our emergency trauma team and mobile life-support ambulances are on standby 24 hours
                  a day, 7 days a week.
                </p>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 sm:pt-2 text-xs font-semibold text-white/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-300" />
                    <span>24/7 Emergency ER</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-300" />
                    <span>Board-Certified Trauma Team</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-300" />
                    <span>Full ICU & Surgical Support</span>
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                <div className="bg-white/15 backdrop-blur-xl border border-white/30 text-white px-5 sm:px-6 py-4 rounded-2xl flex flex-col justify-between shadow-lg">
                  <div className="text-xs font-semibold text-white/80">
                    24/7 Emergency Hotline (1-Tap Dial)
                  </div>
                  <a
                    href="tel:02112345678"
                    className="text-2xl font-extrabold text-sky-300 font-mono tabular-nums flex items-center gap-2 mt-1 hover:text-sky-200 active:scale-95 transition-all"
                  >
                    <PhoneCall className="w-5 h-5 text-sky-300 animate-pulse" />
                    <span>(021) 1234 5678</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenBooking('d3333333-3333-3333-3333-333333333333')}
                    className="mt-3 inline-flex items-center justify-between gap-3 pt-2 border-t border-white/20 text-xs font-bold text-white hover:text-sky-300 active:scale-95 transition-colors min-h-[38px]"
                  >
                    <span>Or Schedule an Appointment Now</span>
                    <span className="w-6 h-6 rounded-md bg-blue-600/90 border border-white/30 text-white flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Glassmorphic Footer — Hidden on Mobile devices (Replaced by sticky bottom nav bar) */}
      <footer className="hidden md:block bg-white/10 backdrop-blur-xl text-white/80 py-8 border-t border-white/20 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold text-white">
            ANAVERSE HOSPITAL · 24 Sudirman Medical Boulevard, South Jakarta
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onSwitchPortal('PATIENT')}
              className="hover:text-white transition-colors"
            >
              Patient Portal
            </button>
            <button
              type="button"
              onClick={() => onSwitchPortal('DOCTOR')}
              className="hover:text-white transition-colors"
            >
              Doctor Clinical EMR
            </button>
            <button
              type="button"
              onClick={() => onSwitchPortal('LAB_TECH')}
              className="hover:text-white transition-colors"
            >
              Lab & Pharmacy LIS
            </button>
            <button
              type="button"
              onClick={() => onSwitchPortal('SUPERADMIN')}
              className="hover:text-white transition-colors"
            >
              Admin & Billing ERP
            </button>
          </div>
        </div>
      </footer>

      {/* Article Reader Modal (Glassmorphic) */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <div className="bg-slate-900/75 backdrop-blur-2xl rounded-2xl border border-white/30 max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="h-48 relative border-b border-white/20">
              <ReferencePhoto cropKey={activeArticle.cropKey} className="w-full h-full" />
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/75 border border-white/20 text-white hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-xs text-sky-300 font-semibold">
                {activeArticle.category} · {activeArticle.date} · {activeArticle.readTime}
              </div>
              <h3 className="text-xl font-extrabold text-white">{activeArticle.title}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{activeArticle.summary}</p>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
                <div className="text-xs font-bold text-white">
                  Clinical Takeaways from Anaverse Medical Board:
                </div>
                <ul className="space-y-1.5 text-xs text-white/85 list-disc pl-4">
                  {activeArticle.clinicalTakeaways.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="px-4 py-2 rounded-lg border border-white/25 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveArticle(null);
                    onOpenBooking();
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600/90 border border-white/30 text-white text-xs font-semibold hover:bg-blue-500"
                >
                  Book Specialist Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
