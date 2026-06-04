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
      return
    }

    if (token && !isPublicRoute) {
      // Obtener el rol del user_info o usar una lógica simple
      let role = 'operativotth';
      try {
        const ui = JSON.parse(localStorage.getItem('user_info') || '{}');
        role = ui.rol_nombre || 'operativotth';
      } catch {}

      const p = location.pathname;
      const isOperativo = role === 'operativotth';
      const isAuxiliar = role === 'auxiliartth';

      // Restricciones para Operativo (sólo ver asistencias y dashboard)
      if (isOperativo && p.startsWith('/tthh/') && !p.includes('/asistencias')) {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (isOperativo && p.startsWith('/users')) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // Restricciones para Auxiliar (no usuarios)
      if (isAuxiliar && p.startsWith('/users')) {
        navigate('/dashboard', { replace: true });
        return;
      }
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
