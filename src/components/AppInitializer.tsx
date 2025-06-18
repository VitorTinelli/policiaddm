"use client";

import { ReactNode } from 'react';
import { useCompanyPermissions } from '../app/commons/useCompanyPermissions';
import { useAuth } from '../app/commons/AuthContext';

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { loading: authLoading } = useAuth();
  const permissions = useCompanyPermissions();

  if (authLoading || !permissions.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
          <div className="text-gray-900 dark:text-white text-xl font-medium">
            Inicializando aplicação...
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Carregando permissões e configurações
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}