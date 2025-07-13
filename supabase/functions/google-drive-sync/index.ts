import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size: string
  webViewLink: string
  webContentLink: string
}

async function getGoogleAccessToken() {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not found')
  }

  const credentials = JSON.parse(serviceAccountKey)
  
  // Create JWT for service account authentication
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // Simple JWT creation (in production, use a proper JWT library)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '')
  const payloadStr = btoa(JSON.stringify(payload)).replace(/=/g, '')
  
  // For this demo, we'll use a simpler approach
  // In production, implement proper JWT signing with the private key
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payloadStr}.signature`, // Placeholder - implement proper signing
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get access token')
  }

  const data = await response.json()
  return data.access_token
}

async function uploadToGoogleDrive(
  fileName: string,
  fileData: Uint8Array,
  mimeType: string,
  folderId?: string
): Promise<GoogleDriveFile> {
  const accessToken = await getGoogleAccessToken()
  
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([fileData], { type: mimeType }))

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to upload to Google Drive: ${response.statusText}`)
  }

  return await response.json()
}

async function createDriveFolder(name: string, parentFolderId?: string): Promise<string> {
  const accessToken = await getGoogleAccessToken()
  
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined,
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    throw new Error(`Failed to create folder: ${response.statusText}`)
  }

  const data = await response.json()
  return data.id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, documentId, fileName, fileData, mimeType, patientName } = await req.json()

    switch (action) {
      case 'upload': {
        // Create patient folder if needed
        const patientFolderName = `Patient_${patientName.replace(/\s+/g, '_')}`
        let patientFolderId: string

        try {
          // Try to find existing folder first
          const accessToken = await getGoogleAccessToken()
          const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${patientFolderName}' and mimeType='application/vnd.google-apps.folder'`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          )
          
          const searchData = await searchResponse.json()
          
          if (searchData.files && searchData.files.length > 0) {
            patientFolderId = searchData.files[0].id
          } else {
            patientFolderId = await createDriveFolder(patientFolderName)
          }
        } catch (error) {
          console.error('Error managing patient folder:', error)
          patientFolderId = await createDriveFolder(patientFolderName)
        }

        // Convert base64 to Uint8Array
        const fileBuffer = new Uint8Array(
          atob(fileData)
            .split('')
            .map(char => char.charCodeAt(0))
        )

        // Upload file to Google Drive
        const driveFile = await uploadToGoogleDrive(
          fileName,
          fileBuffer,
          mimeType,
          patientFolderId
        )

        // Update database with Google Drive info
        const { error: updateError } = await supabaseClient
          .from('patient_documents')
          .update({
            google_drive_file_id: driveFile.id,
            google_drive_url: driveFile.webViewLink,
            is_synced: true,
            last_synced_at: new Date().toISOString(),
            file_size: parseInt(driveFile.size),
            mime_type: driveFile.mimeType,
          })
          .eq('id', documentId)

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({
            success: true,
            driveFile,
            message: 'File uploaded to Google Drive successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'sync_all': {
        // Get all unsynced documents
        const { data: documents, error: fetchError } = await supabaseClient
          .from('patient_documents')
          .select('*')
          .eq('is_synced', false)

        if (fetchError) {
          throw fetchError
        }

        const results = []
        for (const doc of documents || []) {
          try {
            // This would need actual file data - placeholder for now
            results.push({
              documentId: doc.id,
              status: 'pending',
              message: 'Sync functionality would be implemented here',
            })
          } catch (error) {
            results.push({
              documentId: doc.id,
              status: 'error',
              message: error.message,
            })
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            results,
            message: 'Sync process completed',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }
  } catch (error) {
    console.error('Google Drive sync error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Check function logs for more information',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})