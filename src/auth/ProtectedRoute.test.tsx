import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  getAccessibleMenuPaths: vi.fn(),
}))

vi.mock('@/auth/authBridge', () => ({
  isAuthenticated: authState.isAuthenticated,
  getAccessibleMenuPaths: authState.getAccessibleMenuPaths,
}))

import { ProtectedRoute } from '@/auth/ProtectedRoute'

function renderRoute(element: React.ReactNode, initialPath = '/protected') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/signin" element={<div>signin-page</div>} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
        <Route path="/protected" element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to signin', () => {
    authState.isAuthenticated.mockReturnValue(false)
    authState.getAccessibleMenuPaths.mockReturnValue([])

    renderRoute(
      <ProtectedRoute>
        <div>secured-content</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('signin-page')).toBeTruthy()
  })

  it('renders children when no path restriction is provided', () => {
    authState.isAuthenticated.mockReturnValue(true)
    authState.getAccessibleMenuPaths.mockReturnValue([])

    renderRoute(
      <ProtectedRoute>
        <div>secured-content</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('secured-content')).toBeTruthy()
  })

  it('redirects authenticated users when a restricted route has no decoded menu access', () => {
    authState.isAuthenticated.mockReturnValue(true)
    authState.getAccessibleMenuPaths.mockReturnValue([])

    renderRoute(
      <ProtectedRoute allowedPaths={['/sales-orders/admin/general']}>
        <div>secured-content</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('dashboard-page')).toBeTruthy()
  })

  it('redirects authenticated users without matching menu access', () => {
    authState.isAuthenticated.mockReturnValue(true)
    authState.getAccessibleMenuPaths.mockReturnValue(['/sales-orders'])

    renderRoute(
      <ProtectedRoute allowedPaths={['/sales-orders/admin/general']}>
        <div>secured-content</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('dashboard-page')).toBeTruthy()
  })

  it('renders children when an allowed path is present in accessible menus', () => {
    authState.isAuthenticated.mockReturnValue(true)
    authState.getAccessibleMenuPaths.mockReturnValue(['/sales-orders/admin/general'])

    renderRoute(
      <ProtectedRoute allowedPaths={['/sales-orders/admin/general']}>
        <div>secured-content</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('secured-content')).toBeTruthy()
  })
})