export interface FileItem {
  key: string
  size: number
  lastModified: string
}

export async function listFiles(): Promise<FileItem[]> {
  const res = await fetch('/api/files')
  if (!res.ok) throw new Error('ファイル一覧の取得に失敗しました')
  return res.json()
}

export async function uploadFile(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/files/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('アップロードに失敗しました')
}

export async function downloadFile(key: string): Promise<void> {
  const res = await fetch(`/api/files/download/${encodeURIComponent(key)}`)
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
  const res = await fetch(`/api/files/${encodeURIComponent(key)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('削除に失敗しました')
}
