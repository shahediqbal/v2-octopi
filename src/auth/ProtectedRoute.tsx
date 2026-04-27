import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessibleMenuPaths, isAuthenticated } from '@/auth/authBridge'

interface ProtectedRouteProps {
  children: ReactNode
  allowedPaths?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({ children, allowedPaths, fallbackPath = '/dashboard' }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />
  }

  if (allowedPaths && allowedPaths.length > 0) {
    const accessiblePaths = getAccessibleMenuPaths()
    const hasAccess = allowedPaths.some((path) => accessiblePaths.includes(path))
    if (!hasAccess) {
      return <Navigate to={fallbackPath} replace />
    }
  }

  return <>{children}</>
}
