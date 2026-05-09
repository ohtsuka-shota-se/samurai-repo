import { useState, useEffect, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import { listFiles, FileItem } from './api/files'
import './App.css'

function App() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listFiles()
      setFiles(data)
    } catch {
      setError('ファイル一覧の取得に失敗しました。S3バケット名とIAMロールを確認してください。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return (
    <div className="app">
      <header className="header">
        <h1>AWS S3 ファイル管理</h1>
      </header>
      <main className="main">
        <FileUpload onUploadSuccess={fetchFiles} />
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p className="loading">読み込み中...</p>
        ) : (
          <FileList files={files} onDeleteSuccess={fetchFiles} />
        )}
      </main>
    </div>
  )
}

export default App
