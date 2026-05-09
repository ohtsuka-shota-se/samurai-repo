import { useState, useEffect, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'
import { listFiles, FileItem } from './api/files'
import './App.css'

function MainApp() {
  const { userEmail, signOut } = useAuth()
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
        <div className="header-user">
          <span className="user-email">{userEmail}</span>
          <button onClick={signOut} className="btn-logout">ログアウト</button>
        </div>
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

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <p>読み込み中...</p>
      </div>
    )
  }

  return session ? <MainApp /> : <LoginPage />
}

export default App
