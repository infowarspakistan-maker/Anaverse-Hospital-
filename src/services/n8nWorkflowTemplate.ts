export function buildAnaverseN8nWorkflowJson(appBaseUrl: string) {
  const cleanBaseUrl = appBaseUrl.replace(/\/$/, '');
  const callbackEndpoint = `${cleanBaseUrl}/api/webhooks/n8n/callback`;

  return {
    name: 'Anaverse Hospital — Lab Report PDF to Google Drive Vault & PostgreSQL Callback',
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'lab-report-finalized',
          responseMode: 'lastNode',
          options: {},
        },
        id: 'node-webhook-trigger',
        name: '1. Next.js / Express Lab Finalized Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [240, 300],
        webhookId: 'anaverse-lab-report-webhook',
      },
      {
        parameters: {
          jsCode: `// Convert incoming Base64 PDF buffer + metadata into an n8n binary item
const body = $input.first().json.body || $input.first().json;
const pdfBase64 = body.pdfBase64 || '';
const fileName = body.fileName || \`LAB_\${body.barcode || 'REPORT'}.pdf\`;

return [
  {
    json: {
      event: body.event || 'LAB_REPORT_FINALIZED',
      labOrderId: body.labOrderId,
      patientId: body.patientId,
      encounterId: body.encounterId,
      encounterNumber: body.encounterNumber || 'ENC-88319',
      uhid: body.uhid || 'HSP-2026-00412',
      department: body.department || 'Pathology',
      fileName,
      mimeType: 'application/pdf',
      fileSizeBytes: body.fileSizeBytes || 262144,
      documentType: body.documentType || 'LAB_REPORT',
      callbackUrl: body.callbackUrl || '${callbackEndpoint}',
    },
    binary: {
      data: {
        data: pdfBase64,
        mimeType: 'application/pdf',
        fileName: fileName,
      },
    },
  },
];`,
        },
        id: 'node-code-binary',
        name: '2. Decode Base64 PDF Buffer & Prepare Path',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 300],
      },
      {
        parameters: {
          resource: 'folder',
          operation: 'create',
          name: '={{ $json.department + "_" + $json.uhid + "_" + $json.encounterNumber }}',
          folderId: {
            __rl: true,
            value: 'root',
            mode: 'list',
            cachedResultName: '/ (Root folder)',
          },
          options: {},
        },
        id: 'node-gdrive-folder',
        name: '3. Google Drive — Create [Department]/[UHID]/[Encounter] Folder',
        type: 'n8n-nodes-base.googleDrive',
        typeVersion: 3,
        position: [780, 300],
        credentials: {
          googleApi: {
            id: 'gdrive-service-account-cred',
            name: 'Anaverse Hospital Google Drive Service Account',
          },
        },
      },
      {
        parameters: {
          operation: 'upload',
          name: '={{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.fileName }}',
          binaryData: true,
          binaryPropertyName: 'data',
          driveId: {
            __rl: true,
            mode: 'list',
            value: 'My Drive',
          },
          folderId: {
            __rl: true,
            mode: 'id',
            value: '={{ $json.id }}',
          },
          options: {
            fields: ['id', 'name', 'webViewLink', 'size'],
          },
        },
        id: 'node-gdrive-upload',
        name: '4. Google Drive — Upload Lab PDF Buffer',
        type: 'n8n-nodes-base.googleDrive',
        typeVersion: 3,
        position: [1060, 300],
        credentials: {
          googleApi: {
            id: 'gdrive-service-account-cred',
            name: 'Anaverse Hospital Google Drive Service Account',
          },
        },
      },
      {
        parameters: {
          method: 'POST',
          url: '={{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.callbackUrl }}',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'Content-Type',
                value: 'application/json',
              },
              {
                name: 'x-n8n-webhook-secret',
                value: 'sec_568b32a400f1ee74346d1689c8671defaf22bb390dfa3f4372f41de1da9cb16e',
              },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "patientId": "{{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.patientId }}",
  "encounterId": "{{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.encounterId }}",
  "labOrderId": "{{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.labOrderId }}",
  "uhid": "{{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.uhid }}",
  "fileName": "{{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.fileName }}",
  "mimeType": "application/pdf",
  "fileSizeBytes": {{ $json.size || $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.fileSizeBytes }},
  "gdriveFileId": "{{ $json.id }}",
  "gdriveWebViewLink": "{{ $json.webViewLink }}",
  "documentType": "{{ $("2. Decode Base64 PDF Buffer & Prepare Path").item.json.documentType }}"
}`,
          options: {},
        },
        id: 'node-http-callback',
        name: '5. HTTP Request — Ping Anaverse ERP PostgreSQL Callback',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1340, 300],
        onError: 'continueRegularOutput',
      },
    ],
    connections: {
      '1. Next.js / Express Lab Finalized Webhook': {
        main: [
          [
            {
              node: '2. Decode Base64 PDF Buffer & Prepare Path',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      '2. Decode Base64 PDF Buffer & Prepare Path': {
        main: [
          [
            {
              node: '3. Google Drive — Create [Department]/[UHID]/[Encounter] Folder',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      '3. Google Drive — Create [Department]/[UHID]/[Encounter] Folder': {
        main: [
          [
            {
              node: '4. Google Drive — Upload Lab PDF Buffer',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      '4. Google Drive — Upload Lab PDF Buffer': {
        main: [
          [
            {
              node: '5. HTTP Request — Ping Anaverse ERP PostgreSQL Callback',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
    settings: {
      executionOrder: 'v1',
    },
  };
}
