import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'


export type Claims = {
  sub: string
  iss?: string
  aud?: string | string[]
  exp?: number
  iat?: number
  roles?: string[]
  tenant?: string
}

type AuthContextType = {
  claims: Claims | null
  token: string | null
  setToken: (t: string | null) => void
}

const AuthContext = createContext<AuthContextType>({claims: null, token: null, setToken: ()=>{}})

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))
  const claims = useMemo(()=>{
    if (!token) return null
    try { return jwtDecode<Claims>(token) } catch { return null }
  }, [token])

  useEffect(()=>{
    if (token) localStorage.setItem('access_token', token)
    else localStorage.removeItem('access_token')
  }, [token])

  return <AuthContext.Provider value={{claims, token, setToken}}>{children}</AuthContext.Provider>
}

export function useAuth(){ return useContext(AuthContext) }
