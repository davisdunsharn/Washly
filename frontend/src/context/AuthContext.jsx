import { createContext, useContext } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  return (
    <AuthContext.Provider value={{ user, isSignedIn, isLoaded, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
