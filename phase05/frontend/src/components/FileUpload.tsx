import { useState, useRef } from 'react'
import { uploadFile } from '../api/files'
import './FileUpload.css'

interface Props {
  onUploadSuccess: () => void
}

export default function FileUpload({ onUploadSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null)
    setMessage(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setMessage(null)
    try {
      await uploadFile(selectedFile)
      setMessage({ text: `「${selectedFile.name}」をアップロードしました`, isError: false })
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploadSuccess()
    } catch {
      setMessage({ text: 'アップロードに失敗しました', isError: true })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card">
      <h2>ファイルアップロード</h2>
      <div className="upload-controls">
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="btn btn-primary"
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>
      </div>
      {selectedFile && (
        <p className="file-info">
          選択中: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}
      {message && (
        <p className={message.isError ? 'msg-error' : 'msg-success'}>{message.text}</p>
      )}
    </div>
  )
}
