# Anaverse Hospital — Enterprise Hospital ERP & Clinical CMS

Full-stack Hospital ERP, Clinical Electronic Medical Records (EMR), Laboratory Information System (LIS), Google Drive HIPAA Vault, and Public Smart Booking Platform.

## Key Modules
- **Public CMS & Smart Booking**: Smooth-scroll 100-frame canvas background, animated specialist roster, visual department spotlight, and real-time OPD queue token issuance.
- **Doctor Clinical EMR**: SOAP note composer, AI-assisted ICD-10 coding, real-time drug-allergy interaction verification, and e-Prescription (eRx) dispatch.
- **LIS Lab, Pharmacy & Google Drive Vault**: Barcode sample verification, automated PDF lab report generation, n8n webhook + Google Drive mirroring, and inpatient bed management (ADT).
- **Admin & Split-Billing Cashier**: Multi-payer insurance/TPA split invoicing and executive revenue telemetry.

## Quick Start
```bash
npm install
npm run dev
```

## 3-Stage GitHub Push Guide (Under 100 Files Per Push)
The workspace has been cleaned and structured into **158 total tracked files** across **3 stages** (each well below the 100-file push limit):

| Stage | Branch / Tag | File Count | Contents |
| :--- | :--- | :--- | :--- |
| **Stage 1** | `stage-1` | **59 files** | Core React + Express ERP source (`src/`, `server.ts`), DB schema, doctor GIFs, service/facility/news images |
| **Stage 2** | `stage-2` | **50 files** | Smooth-scroll sequence frames `ezgif-frame-001.jpg` – `ezgif-frame-050.jpg` |
| **Stage 3** | `stage-3` (`main`) | **50 files** | Smooth-scroll sequence frames `ezgif-frame-051.jpg` – `ezgif-frame-100.jpg` |

### Option A: Automated 1-Command 3-Stage Push
```bash
chmod +x push-3-stages.sh
./push-3-stages.sh https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
```

### Option B: Manual 3-Stage Push Commands
```bash
alias g="git --git-dir=/tmp/anaverse-git/.git --work-tree=/app/applet"
g remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git

# Push Stage 1 (59 files)
g push -u origin stage-1:main

# Push Stage 2 (+50 files)
g push origin stage-2:main

# Push Stage 3 (+50 files)
g push origin stage-3:main
```

