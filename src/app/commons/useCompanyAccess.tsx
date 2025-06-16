import { useState, useEffect, useCallback } from 'react';

interface CompanyAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  bypassReason?: 'COR' | 'SUP' | null;
}

// Cache local para acesso às companhias
const accessCache = new Map<string, { hasAccess: boolean; timestamp: number; bypassReason?: 'COR' | 'SUP' | null }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Grupos que têm bypass na verificação de companhia
const BYPASS_GROUPS = ['COR', 'SUP'];

// Função para determinar grupo de bypass baseado em tag ou patente
function getBypassGroup(userTag: string | null, userPatente: string | null): 'COR' | 'SUP' | null {
  // Prioridade 1: Verificar por tag
  if (userTag && BYPASS_GROUPS.includes(userTag)) {
    return userTag as 'COR' | 'SUP';
  }
  
  // Prioridade 2: Verificar por patente (para casos onde tag não está definida)
  if (!userTag && userPatente) {
    if (userPatente.includes('Supremo') || userPatente.includes('Comandante Supremo')) {
      return 'SUP';
    }
    if (userPatente.includes('Corregedoria') || userPatente.includes('Corregedor')) {
      return 'COR';
    }
  }
  
  return null;
}

export function useCompanyAccess(userEmail: string | undefined, companyCode: number | undefined): CompanyAccessResult {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bypassReason, setBypassReason] = useState<'COR' | 'SUP' | null>(null);

  const checkAccess = useCallback(async () => {
    if (!userEmail || !companyCode) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const cacheKey = `${userEmail}_${companyCode}`;
    
    // Verificar cache local primeiro
    const cached = accessCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setHasAccess(cached.hasAccess);
      setBypassReason(cached.bypassReason || null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);      // Primeiro verificar se o usuário tem uma tag de bypass
      const userResponse = await fetch(`/api/profiles?email=${encodeURIComponent(userEmail)}`);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userTag = userData.data?.militar?.tag;
        const userPatente = userData.data?.militar?.patente_nome;
        
        // Verificar se usuário tem bypass (por tag ou patente)
        const bypassGroup = getBypassGroup(userTag, userPatente);
        
        // Se encontrou um grupo de bypass
        if (bypassGroup) {
          // Salvar no cache o bypass
          accessCache.set(cacheKey, {
            hasAccess: true,
            timestamp: Date.now(),
            bypassReason: bypassGroup
          });
          
          setHasAccess(true);
          setBypassReason(bypassGroup);
          setLoading(false);
          return;
        }
      }
      
      // Se não tem bypass, verificar acesso normal à companhia
      const response = await fetch(`/api/profiles?checkCompany=true&email=${encodeURIComponent(userEmail)}&companyId=${companyCode}`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar acesso à companhia');
      }

      const data = await response.json();
      const hasCompanyAccess = data.isMember || false;
      
      // Salvar no cache
      accessCache.set(cacheKey, {
        hasAccess: hasCompanyAccess,
        timestamp: Date.now(),
        bypassReason: null
      });
      
      setHasAccess(hasCompanyAccess);
      setBypassReason(null);
    } catch (err) {
      console.error('Erro ao verificar acesso à companhia:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setHasAccess(false);
      setBypassReason(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail, companyCode]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, error, bypassReason };
}

// Função para limpar cache quando necessário
export function clearCompanyAccessCache(userEmail?: string, companyCode?: number) {
  if (userEmail && companyCode) {
    accessCache.delete(`${userEmail}_${companyCode}`);
  } else {
    accessCache.clear();
  }
}

// Função para verificar se um usuário tem bypass baseado na tag ou patente
export function hasCompanyBypass(userTag: string | undefined, userPatente?: string | undefined): boolean {
  // Verificar por tag primeiro
  if (userTag && BYPASS_GROUPS.includes(userTag)) {
    return true;
  }
  
  // Se não tem tag, verificar por patente
  if (!userTag && userPatente) {
    if (userPatente.includes('Supremo') || userPatente.includes('Comandante Supremo')) {
      return true;
    }
    if (userPatente.includes('Corregedoria') || userPatente.includes('Corregedor')) {
      return true;
    }
  }
  
  return false;
}

// Função para obter grupos com bypass (útil para documentação/debugging)
export function getBypassGroups(): string[] {
  return [...BYPASS_GROUPS];
}

export default useCompanyAccess;
