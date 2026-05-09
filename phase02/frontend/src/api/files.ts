import { getIdToken } from '../auth/cognito'

export interface FileItem {
  key: string
  size: number
  lastModified: string
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function listFiles(): Promise<FileItem[]> {
  const res = await fetch('/api/files', { headers: await authHeaders() })
  if (!res.ok) throw new Error('ファイル一覧の取得に失敗しました')
  return res.json()
}

export async function uploadFile(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/files/upload', {
    method: 'POST',
    headers: await authHeaders(),
    body: formData,
  })
  if (!res.ok) throw new Error('アップロードに失敗しました')
}

export async function downloadFile(key: string): Promise<void> {
  const res = await fetch(`/api/files/download/${encodeURIComponent(key)}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('ダウンロードに失敗しました')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = key
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`/api/files/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('削除に失敗しました')
}
