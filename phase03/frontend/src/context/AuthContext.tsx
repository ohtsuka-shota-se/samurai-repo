import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import { getCurrentSession, signOut as cognitoSignOut, getCurrentUserEmail } from '../auth/cognito'

interface AuthContextValue {
  session: CognitoUserSession | null
  userEmail: string | null
  loading: boolean
  signOut: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CognitoUserSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    const s = await getCurrentSession()
    setSession(s)
  }

  useEffect(() => {
    getCurrentSession().then(s => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  const signOut = () => {
    cognitoSignOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      userEmail: session ? getCurrentUserEmail() : null,
      loading,
      signOut,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
