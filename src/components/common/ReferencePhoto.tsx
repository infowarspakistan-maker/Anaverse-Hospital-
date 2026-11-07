import React, { useState } from 'react';

export type ReferenceCropKey =
  | 'hero-doctor-child'
  | 'building-exterior'
  | 'service-poli'
  | 'service-inap'
  | 'service-igd'
  | 'service-radiologi'
  | 'service-lab'
  | 'service-farmasi'
  | 'doc-andika'
  | 'doc-salsabila'
  | 'doc-budi'
  | 'doc-meilani'
  | 'fac-icu'
  | 'fac-vip'
  | 'fac-operasi'
  | 'fac-lab'
  | 'fac-ambulans'
  | 'news-jantung'
  | 'news-anak'
  | 'news-gaya-hidup'
  | 'news-lansia'
  | 'emergency-igd';

interface PhotoConfig {
  src: string;
  fallbackSrc: string;
  label: string;
}

const PHOTO_CONFIG: Record<ReferenceCropKey, PhotoConfig> = {
  // Hero & Doctors (GIF animations)
  'hero-doctor-child': {
    src: "/Doctor_holding_child's_hand_32be3aaf.gif",
    fallbackSrc: "/assets/Doctor_holding_child's_hand_32be3aaf.gif",
    label: "Doctor holding child's hand",
  },
  'doc-andika': {
    src: '/Doctor_adjusts_posture_in_hallway_2cab1d82.gif',
    fallbackSrc: '/assets/Doctor_adjusts_posture_in_hallway_2cab1d82.gif',
    label: 'Dr. Andika Pratama',
  },
  'doc-salsabila': {
    src: '/Female_doctor_in_hospital_hallway_1e6c454b.gif',
    fallbackSrc: '/assets/Female_doctor_in_hospital_hallway_1e6c454b.gif',
    label: 'Dr. Salsabila Putri',
  },
  'doc-budi': {
    src: '/Healthcare_worker_adjusts_stance_7374fd6f.gif',
    fallbackSrc: '/assets/Healthcare_worker_adjusts_stance_7374fd6f.gif',
    label: 'Dr. Budi Santoso',
  },
  'doc-meilani': {
    src: '/Healthcare_worker_smiles_in_hallway_6854f5a2.gif',
    fallbackSrc: '/assets/Healthcare_worker_smiles_in_hallway_6854f5a2.gif',
    label: 'Dr. Meilani Putri',
  },

  // Our Medical Services
  'service-poli': {
    src: '/services/specialist-clinics.jpg',
    fallbackSrc: '/our Medical Services/Specialist Clinics.jpg',
    label: 'Specialist Clinics',
  },
  'service-inap': {
    src: '/services/inpatient-care.jpg',
    fallbackSrc: '/our Medical Services/Inpatiant Care.jpg',
    label: 'Inpatient Care',
  },
  'service-igd': {
    src: '/services/emergency-er.jpg',
    fallbackSrc: '/our Medical Services/24 7 Emergency (ER).jpg',
    label: '24/7 Emergency (ER)',
  },
  'service-radiologi': {
    src: '/services/radiology-imaging.jpg',
    fallbackSrc: '/our Medical Services/Radiology & Imaging.jpg',
    label: 'Radiology & Imaging',
  },
  'service-lab': {
    src: '/services/clinical-laboratory.jpg',
    fallbackSrc: '/our Medical Services/Clinical Laboratory.jpg',
    label: 'Clinical Laboratory',
  },
  'service-farmasi': {
    src: '/services/hospital-pharmacy.jpg',
    fallbackSrc: '/our Medical Services/Hospital Pharmacy.jpg',
    label: 'Hospital Pharmacy',
  },
  'emergency-igd': {
    src: '/services/emergency-er.jpg',
    fallbackSrc: '/our Medical Services/24 7 Emergency (ER).jpg',
    label: '24/7 Emergency (ER)',
  },

  // Modern Facilities for Superior Recovery
  'fac-icu': {
    src: '/facilities/intensive-care-unit.jpg',
    fallbackSrc: '/Modern Facilities for Superior Recovery/Intensive Care Unit (ICU).jpg',
    label: 'Intensive Care Unit (ICU)',
  },
  'fac-vip': {
    src: '/facilities/vip-inpatient-suites.jpg',
    fallbackSrc: '/Modern Facilities for Superior Recovery/VIP Inpatiant Suites.jpg',
    label: 'VIP Inpatient Suites',
  },
  'fac-operasi': {
    src: '/facilities/operation-theater.jpg',
    fallbackSrc: '/Modern Facilities for Superior Recovery/Operation Thetor.jpg',
    label: 'Operation Theater',
  },
  'fac-lab': {
    src: '/facilities/clinical-laboratory.jpg',
    fallbackSrc: '/Modern Facilities for Superior Recovery/Clinical Laboratory.jpg',
    label: 'Clinical Pathology Laboratory',
  },
  'fac-ambulans': {
    src: '/facilities/ambulance-fleet.jpg',
    fallbackSrc: '/Modern Facilities for Superior Recovery/24 7 Ambulance Fleet.jpg',
    label: '24/7 Ambulance Fleet',
  },

  // Health News & Medical Tips
  'news-jantung': {
    src: '/health-news/cardiovascular-health.jpg',
    fallbackSrc: '/Health News & Medical Tips/Essential Daily Habits for Cardiovascular Health.jpg',
    label: 'Essential Daily Habits for Cardiovascular Health',
  },
  'news-anak': {
    src: '/health-news/childhood-immunization.jpg',
    fallbackSrc: '/Health News & Medical Tips/The Importance of Early Childhood Immunization.jpg',
    label: 'The Importance of Early Childhood Immunization',
  },
  'news-gaya-hidup': {
    src: '/health-news/balanced-nutrition.jpg',
    fallbackSrc: '/Health News & Medical Tips/Balanced Nutrition for Optimal Metabolic Wellness.jpg',
    label: 'Balanced Nutrition for Optimal Metabolic Wellness',
  },
  'news-lansia': {
    src: '/health-news/geriatric-care.jpg',
    fallbackSrc: '/Health News & Medical Tips/Comprehensive Geriatric Care for Your Loved Ones.jpg',
    label: 'Comprehensive Geriatric Care for Your Loved Ones',
  },

  'building-exterior': {
    src: '/assets/anaverse-hospital-exterior.jpg',
    fallbackSrc: '/assets/anaverse-hospital-building.jpg',
    label: 'Anaverse Hospital Central Medical Center Building',
  },
};

interface ReferencePhotoProps {
  cropKey: ReferenceCropKey;
  className?: string;
  alt?: string;
}

export const ReferencePhoto: React.FC<ReferencePhotoProps> = ({ cropKey, className = '', alt }) => {
  const config = PHOTO_CONFIG[cropKey] || PHOTO_CONFIG['building-exterior'];
  const [currentSrc, setCurrentSrc] = useState<string>(config.src);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  const handleError = () => {
    if (currentSrc === config.src && config.fallbackSrc) {
      setCurrentSrc(encodeURI(config.fallbackSrc));
    } else {
      setLoadFailed(true);
    }
  };

  if (loadFailed) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 flex items-center justify-center text-white/50 text-xs ${className}`}
        role="img"
        aria-label={alt || config.label}
      >
        <span className="p-2 text-center">{alt || config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-slate-900 ${className}`}
      role="img"
      aria-label={alt || config.label}
    >
      <img
        src={currentSrc}
        alt={alt || config.label}
        onError={handleError}
        loading="lazy"
        className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};
