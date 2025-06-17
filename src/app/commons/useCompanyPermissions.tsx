import { useAuth } from './AuthContext';
import { useState, useEffect } from 'react';

interface CompanhiaInfo {
  id: string;
  companhiaId: number;
  nome: string;
  sigla: string;
}

interface CachedProfileData {
  militar?: {
    email?: string;
  };
  companhias?: CompanhiaInfo[];
}

interface CompanyPermissions {
  isEFB: boolean;
  isSUP: boolean; 
  isCOR: boolean;
  hasFullAccess: boolean; 
  userCompanies: CompanhiaInfo[];
}

export function useCompanyPermissions(): CompanyPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<CompanyPermissions>({
    isEFB: false,
    isSUP: false,
    isCOR: false,
    hasFullAccess: false,
    userCompanies: []
  });

  useEffect(() => {
    if (!user?.email) {
      setPermissions({
        isEFB: false,
        isSUP: false,
        isCOR: false,
        hasFullAccess: false,
        userCompanies: []
      });
      return;
    }    // Buscar informações de companhia do cache de todos os perfis
    // Primeiro tenta encontrar qual perfil pertence ao usuário logado
    let userProfile: any = null;
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('profile_'));
    
    console.log(`[Permissions] Procurando perfil para user.email: ${user.email}`);
    console.log(`[Permissions] Cache keys encontradas:`, cacheKeys);
    
    for (const key of cacheKeys) {      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const profileData: CachedProfileData = JSON.parse(cachedData);
          console.log(`[Permissions] Verificando cache ${key}:`, {
            email: profileData.militar?.email,
            nick: (profileData as any).militar?.nick,
            hasCompanhias: !!(profileData.companhias?.length)
          });
          
          // Verificar se o perfil pertence ao usuário logado
          // Comparar por email ou se o cache key inclui o email do usuário
          const isMatch = profileData.militar?.email === user.email || 
                         key.includes(user.email) ||
                         // Se o userEmail não contém @, pode ser um nick
                         (!user.email.includes('@') && (profileData as any).militar?.nick === user.email);
          
          if (isMatch) {
            console.log(`[Permissions] Match encontrado no cache ${key}`);
            userProfile = profileData;
            break;
          }
        }
      } catch (error) {
        console.error(`[Permissions] Erro ao processar cache ${key}:`, error);
      }
    }
    
    if (userProfile && userProfile.companhias) {
      const companhias = userProfile.companhias || [];
      
      const isEFB = companhias.some((comp: CompanhiaInfo) => 
        comp.sigla?.toUpperCase() === 'EFB' || 
        comp.nome?.toLowerCase().includes('escola') ||
        comp.nome?.toLowerCase().includes('formação')
      );
      
      const isSUP = companhias.some((comp: CompanhiaInfo) => 
        comp.sigla?.toUpperCase() === 'SUP' || 
        comp.nome?.toLowerCase().includes('supremacia')
      );
      
      const isCOR = companhias.some((comp: CompanhiaInfo) => 
        comp.sigla?.toUpperCase() === 'COR' || 
        comp.nome?.toLowerCase().includes('corregedoria')
      );

      const hasFullAccess = isSUP || isCOR;

      console.log(`[Permissions] Usuário ${user.email}: EFB=${isEFB}, SUP=${isSUP}, COR=${isCOR}, FullAccess=${hasFullAccess}`);
      console.log(`[Permissions] Companhias:`, companhias);

      setPermissions({
        isEFB,
        isSUP,
        isCOR,
        hasFullAccess,
        userCompanies: companhias
      });
    } else {
      console.log(`[Permissions] Nenhum cache de companhias encontrado para usuário ${user.email}`);
      setPermissions({
        isEFB: false,
        isSUP: false,
        isCOR: false,
        hasFullAccess: false,
        userCompanies: []
      });
    }
  }, [user?.email]);

  return permissions;
}
