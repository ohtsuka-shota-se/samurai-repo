import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import ReviewFormPage from './pages/ReviewFormPage'
import ReviewListPage from './pages/ReviewListPage'
import FilesPage from './pages/FilesPage'
import AnalysisPage from './pages/AnalysisPage'
import { useAuth } from './context/AuthContext'
import './App.css'

type Page = 'review-form' | 'review-list' | 'files' | 'analysis'

function App() {
  const { session, userEmail, signOut, loading } = useAuth()
  const [page, setPage] = useState<Page>('review-form')
  const [showLogin, setShowLogin] = useState(false)
  const [pendingPage, setPendingPage] = useState<Page | null>(null)

  // ログイン成功後、遷移先ページへ移動
  useEffect(() => {
    if (session) {
      setShowLogin(false)
      if (pendingPage) {
        setPage(pendingPage)
        setPendingPage(null)
      }
    }
  }, [session, pendingPage])

  const navigate = (target: Page) => {
    if ((target === 'review-list' || target === 'files' || target === 'analysis') && !session) {
      setPendingPage(target)
      setShowLogin(true)
      return
    }
    setPage(target)
  }

  if (loading) {
    return <div className="app-loading"><p>読み込み中...</p></div>
  }

  if (showLogin && !session) {
    return <LoginPage onBack={() => { setShowLogin(false); setPendingPage(null) }} />
  }

  return (
    <div className="app">
      <header className="header">
        <span className="header-logo">AWS 学習アプリ</span>
        <nav className="header-nav">
          <button
            className={`nav-item ${page === 'review-form' ? 'active' : ''}`}
            onClick={() => navigate('review-form')}
          >
            レビュー投稿
          </button>
          <button
            className={`nav-item ${page === 'review-list' ? 'active' : ''} ${!session ? 'locked' : ''}`}
            onClick={() => navigate('review-list')}
          >
            レビュー一覧{!session && ' 🔒'}
          </button>
          <button
            className={`nav-item ${page === 'files' ? 'active' : ''} ${!session ? 'locked' : ''}`}
            onClick={() => navigate('files')}
          >
            ファイル管理{!session && ' 🔒'}
          </button>
          <button
            className={`nav-item ${page === 'analysis' ? 'active' : ''} ${!session ? 'locked' : ''}`}
            onClick={() => navigate('analysis')}
          >
            AI分析{!session && ' 🔒'}
          </button>
        </nav>
        <div className="header-right">
          {session ? (
            <>
              <span className="user-email">{userEmail}</span>
              <button onClick={signOut} className="btn-logout">ログアウト</button>
            </>
          ) : (
            <button onClick={() => { setPendingPage(null); setShowLogin(true) }} className="btn-login">
              ログイン
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {page === 'review-form' && <ReviewFormPage />}
        {page === 'review-list' && <ReviewListPage />}
        {page === 'files' && <FilesPage />}
        {page === 'analysis' && <AnalysisPage />}
      </main>
    </div>
  )
}

export default App
