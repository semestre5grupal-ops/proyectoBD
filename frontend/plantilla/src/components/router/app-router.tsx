"use client"

import { Suspense, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { routes, type RouteConfig } from '@/config/routes'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function renderRoutes(routeConfigs: RouteConfig[]) {
  return routeConfigs.map((route, index) => (
    <Route
      key={route.path + index}
      path={route.path}
      element={
        <Suspense fallback={<LoadingSpinner />}>
          {route.element}
        </Suspense>
      }
    >
      {route.children && renderRoutes(route.children)}
    </Route>
  ))
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    const isPublicRoute = 
      location.pathname.startsWith('/auth') || 
      location.pathname === '/landing' || 
      location.pathname === '/'

    if (!token && !isPublicRoute) {
      navigate('/auth/sign-in', { replace: true })
    }
  }, [navigate, location])

  return <>{children}</>
}

export function AppRouter() {
  return (
    <AuthGuard>
      <Routes>
        {renderRoutes(routes)}
      </Routes>
    </AuthGuard>
  )
}
