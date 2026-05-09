import { useState } from 'react'
import { FileItem, downloadFile, deleteFile } from '../api/files'
import './FileList.css'

interface Props {
  files: FileItem[]
  onDeleteSuccess: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ja-JP')
}

export default function FileList({ files, onDeleteSuccess }: Props) {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const handleDownload = async (key: string) => {
    setDownloadingKey(key)
    try {
      await downloadFile(key)
    } catch {
      alert('ダウンロードに失敗しました')
    } finally {
      setDownloadingKey(null)
    }
  }

  const handleDelete = async (key: string) => {
    if (!window.confirm(`「${key}」を削除しますか？`)) return
    setDeletingKey(key)
    try {
      await deleteFile(key)
      onDeleteSuccess()
    } catch {
      alert('削除に失敗しました')
    } finally {
      setDeletingKey(null)
    }
  }

  return (
    <div className="card">
      <h2>ファイル一覧 {files.length > 0 && `(${files.length}件)`}</h2>
      {files.length === 0 ? (
        <p className="empty">ファイルがありません。アップロードしてみましょう。</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ファイル名</th>
                <th>サイズ</th>
                <th>更新日時</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.key}>
                  <td className="filename">{file.key}</td>
                  <td className="size">{formatSize(file.size)}</td>
                  <td className="date">{formatDate(file.lastModified)}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleDownload(file.key)}
                      disabled={downloadingKey === file.key}
                      className="btn btn-download"
                    >
                      {downloadingKey === file.key ? '...' : 'ダウンロード'}
                    </button>
                    <button
                      onClick={() => handleDelete(file.key)}
                      disabled={deletingKey === file.key}
                      className="btn btn-delete"
                    >
                      {deletingKey === file.key ? '...' : '削除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
