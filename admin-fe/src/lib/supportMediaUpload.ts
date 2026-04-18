import {
  createMediaUploadSession,
  finalizeMediaUpload,
  type BackendMediaAssetResponse,
} from './adminApi'

const DEFAULT_FILE_CONTENT_TYPE = 'application/octet-stream'

const parseJsonError = (raw: string | null): string | null => {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as { error?: string }
    const message = parsed?.error?.trim()
    return message || null
  } catch {
    return null
  }
}

const uploadByXhr = ({
  method,
  url,
  file,
  headers,
  onProgress,
}: {
  method: 'PUT' | 'POST'
  url: string
  file: File
  headers?: Record<string, string>
  onProgress?: (percent: number) => void
}) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    Object.entries(headers ?? {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return
      }
      onProgress(Math.min(100, Math.max(1, Math.round((event.loaded / event.total) * 100))))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }
      reject(
        new Error(
          parseJsonError(xhr.responseText) ?? `Upload failed (${xhr.status})`,
        ),
      )
    }
    if (method === 'POST') {
      const formData = new FormData()
      formData.append('file', file)
      xhr.send(formData)
      return
    }
    xhr.send(file)
  })

export const uploadSupportMediaAsset = async ({
  token,
  file,
  onProgress,
}: {
  token: string
  file: File
  onProgress?: (percent: number) => void
}): Promise<BackendMediaAssetResponse> => {
  const contentType = file.type.trim() || DEFAULT_FILE_CONTENT_TYPE
  onProgress?.(5)

  const session = await createMediaUploadSession(token, {
    fileName: file.name,
    contentType,
    sizeBytes: file.size,
    category: 'support_ticket',
  })

  onProgress?.(10)

  if (session.uploadMethod === 'PRESIGNED_PUT') {
    await uploadByXhr({
      method: 'PUT',
      url: session.uploadUrl,
      file,
      headers: session.uploadHeaders ?? undefined,
      onProgress: (percent) => {
        onProgress?.(10 + Math.round(percent * 0.8))
      },
    })
  } else {
    await uploadByXhr({
      method: 'POST',
      url: session.uploadUrl,
      file,
      headers: { Authorization: `Bearer ${token}` },
      onProgress: (percent) => {
        onProgress?.(10 + Math.round(percent * 0.8))
      },
    })
  }

  onProgress?.(95)
  const finalized = await finalizeMediaUpload(token, session.mediaAssetId)
  onProgress?.(100)
  return finalized
}

