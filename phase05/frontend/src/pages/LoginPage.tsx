import { useState } from 'react'
import { signIn, signUp, confirmSignUp } from '../auth/cognito'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

type Mode = 'login' | 'signup' | 'confirm'

const ERROR_MAP: Record<string, string> = {
  NotAuthorizedException: 'メールアドレスまたはパスワードが違います',
  UserNotFoundException: 'ユーザーが見つかりません',
  UsernameExistsException: 'このメールアドレスはすでに登録されています',
  InvalidPasswordException: 'パスワードは8文字以上で、大文字・小文字・数字・記号（例: !@#$）を含めてください',
  CodeMismatchException: '確認コードが違います',
  ExpiredCodeException: '確認コードの有効期限が切れています。再度サインアップしてください',
  InvalidParameterException: '入力内容に誤りがあります',
}

function toJapanese(err: { code?: string; message?: string }): string {
  return (err.code && ERROR_MAP[err.code]) || err.message || 'エラーが発生しました'
}

export default function LoginPage({ onBack }: { onBack?: () => void }) {
  const { refreshSession } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      await refreshSession()
    } catch (err: unknown) {
      setError(toJapanese(err as { code?: string; message?: string }))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(email, password)
      setMode('confirm')
    } catch (err: unknown) {
      setError(toJapanese(err as { code?: string; message?: string }))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await confirmSignUp(email, code)
      await signIn(email, password)
      await refreshSession()
    } catch (err: unknown) {
      setError(toJapanese(err as { code?: string; message?: string }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {onBack && (
          <button className="btn-back-login" onClick={onBack} type="button">
            ← レビュー投稿に戻る
          </button>
        )}
        <h1 className="login-title">AWS 学習アプリ</h1>

        {mode !== 'confirm' && (
          <div className="tab-bar">
            <button
              className={`tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              type="button"
            >
              ログイン
            </button>
            <button
              className={`tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
              type="button"
            >
              新規登録
            </button>
          </div>
        )}

        {mode === 'confirm' && (
          <p className="confirm-note">
            <strong>{email}</strong> に確認コードを送信しました。
            メールを確認して6桁のコードを入力してください。
          </p>
        )}

        <form onSubmit={
          mode === 'login' ? handleLogin
          : mode === 'signup' ? handleSignUp
          : handleConfirm
        }>
          {mode !== 'confirm' && (
            <>
              <div className="field">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="example@email.com"
                />
              </div>
              <div className="field">
                <label>
                  パスワード
                  {mode === 'signup' && (
                    <span className="hint">（8文字以上・大文字・小文字・数字・記号を含む）</span>
                  )}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <div className="field">
              <label>確認コード（6桁）</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                disabled={loading}
                placeholder="123456"
                maxLength={6}
              />
            </div>
          )}

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading} className="btn-submit">
            {loading
              ? '処理中...'
              : mode === 'login' ? 'ログイン'
              : mode === 'signup' ? '登録する'
              : '確認して完了'}
          </button>
        </form>
      </div>
    </div>
  )
}
