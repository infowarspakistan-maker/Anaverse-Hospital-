import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, accessToken: string | null, idToken: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        cachedIdToken = await user.getIdToken();
        if (onAuthSuccess) {
          onAuthSuccess(user, cachedAccessToken, cachedIdToken);
        }
      } catch {
        cachedAccessToken = null;
        cachedIdToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      cachedIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
  idToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google Drive OAuth access token');
    }

    cachedAccessToken = credential.accessToken;
    cachedIdToken = await result.user.getIdToken();

    // Sync user to Cloud SQL PostgreSQL
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cachedIdToken}`,
      },
    });

    return {
      user: result.user,
      accessToken: cachedAccessToken,
      idToken: cachedIdToken,
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;
export const getIdToken = (): string | null => cachedIdToken;

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedIdToken = null;
};

/**
 * Generates a valid binary PDF 1.4 buffer for a clinical lab report or discharge summary.
 */
export function buildClinicalPdfBlob(params: {
  title: string;
  uhid: string;
  patientName: string;
  encounterNumber: string;
  department: string;
  doctorName: string;
  lines: string[];
}): Blob {
  const safeText = (str: string) =>
    str.replace(/[()\\]/g, '').replace(/[^\x20-\x7E]/g, ' ');

  const contentLines = [
    'BT',
    '/F1 16 Tf',
    '50 760 Td',
    `(ANAVERSE HOSPITAL - CLINICAL DOCUMENT VAULT) Tj`,
    '/F1 11 Tf',
    '0 -24 Td',
    `(${safeText(params.title)}) Tj`,
    '0 -20 Td',
    `(Patient Name: ${safeText(params.patientName)}   |   UHID: ${safeText(params.uhid)}) Tj`,
    '0 -16 Td',
    `(Encounter ID: ${safeText(params.encounterNumber)}   |   Department: ${safeText(params.department)}) Tj`,
    '0 -16 Td',
    `(Ordering Clinician: ${safeText(params.doctorName)}   |   Timestamp: ${new Date().toISOString()}) Tj`,
    '0 -24 Td',
    '(--------------------------------------------------------------------------------) Tj',
  ];

  params.lines.forEach((line) => {
    contentLines.push('0 -16 Td');
    contentLines.push(`(${safeText(line)}) Tj`);
  });

  contentLines.push('0 -28 Td');
  contentLines.push('(Digitally Signed & Archived via Anaverse Hospital LIS & Google Drive Vault) Tj');
  contentLines.push('ET');

  const streamContent = contentLines.join('\n');
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000297 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + streamContent.length}
%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
}

/**
 * Locates an existing folder by name within a parent in Google Drive, or creates it.
 */
async function getOrCreateDriveFolder(
  folderName: string,
  parentId: string | null,
  accessToken: string
): Promise<string> {
  const parentClause = parentId ? `'${parentId}' in parents and ` : '';
  const q = `${parentClause}name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name)&spaces=drive`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listRes.ok) {
    const data = await listRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  const folderMetadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    folderMetadata.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(folderMetadata),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Drive folder creation failed: ${errText}`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Uploads a medical PDF into the structured Google Drive hierarchy:
 * HOSPITAL_ERP_VAULT -> [Department] -> [Patient UHID] -> [Encounter ID] -> File
 */
export async function uploadMedicalDocumentToDriveVault(payload: {
  blob: Blob;
  fileName: string;
  uhid: string;
  encounterNumber: string;
  department: string;
  accessToken: string;
}): Promise<{
  fileId: string;
  webViewLink: string;
  folderPath: string;
}> {
  const { blob, fileName, uhid, encounterNumber, department, accessToken } = payload;

  // Build exact hierarchy from blueprint Section 2:
  // HOSPITAL_ERP_VAULT -> Department -> UHID -> Encounter
  const rootFolderId = await getOrCreateDriveFolder('HOSPITAL_ERP_VAULT', null, accessToken);
  const deptFolderId = await getOrCreateDriveFolder(department, rootFolderId, accessToken);
  const uhidFolderId = await getOrCreateDriveFolder(uhid, deptFolderId, accessToken);
  const encounterFolderId = await getOrCreateDriveFolder(encounterNumber, uhidFolderId, accessToken);

  const metadata = {
    name: `${Date.now()}_${fileName}`,
    mimeType: 'application/pdf',
    parents: [encounterFolderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', blob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${errText}`);
  }

  const fileData = await uploadRes.json();
  return {
    fileId: fileData.id,
    webViewLink:
      fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    folderPath: `HOSPITAL_ERP_VAULT / ${department} / ${uhid} / ${encounterNumber}`,
  };
}
