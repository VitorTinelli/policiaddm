'use client';

import { useEffect } from 'react';
import { clearOtherUsersCaches, clearDuplicateProfileCaches } from './cacheUtils';
import { useAuth } from './AuthContext';

/**
 * Componente para inicializar a limpeza de caches de segurança
 * Remove dados sensíveis de outros usuários que possam estar armazenados
 */
export function CacheSecurityInitializer() {
  const { user } = useAuth();

  useEffect(() => {    // Executar limpeza ao carregar a aplicação
    const initializeCacheSecurity = () => {
      try {
        // Primeiro, limpar caches duplicados
        clearDuplicateProfileCaches();
        
        // Depois, limpar caches de outros usuários
        const userNick = user?.user_metadata?.nick || user?.user_metadata?.nickname;
        clearOtherUsersCaches(userNick, user?.email);
        
        console.log('[Security] Limpeza de cache de segurança executada');
      } catch (error) {
        console.error('[Security] Erro na limpeza de cache:', error);
      }
    };

    // Aguardar um pouco para o contexto de autenticação se estabilizar
    const timeoutId = setTimeout(initializeCacheSecurity, 1000);

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Este componente não renderiza nada
  return null;
}
