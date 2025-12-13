import React from 'react'
import { Navigate } from 'react-router-dom'
import { hasRole } from '../lib/auth'

// Expect a Claims provider from context (left for integration with your auth)
export const Protected: React.FC<{claims: any, role?: string, children: React.ReactNode}> = ({claims, role, children}) => {
  if (role && !hasRole(claims, role)) return <Navigate to="/403" replace />
  return <>{children}</>
}
