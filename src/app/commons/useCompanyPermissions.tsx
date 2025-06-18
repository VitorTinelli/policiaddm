import { useAuth } from "./AuthContext";
import { useState, useEffect } from "react";

interface CompanhiaInfo {
  id: string;
  companhiaId: number;
  nome: string;
  sigla: string;
}

interface CachedProfileData {
  militar?: {
    email?: string;
    nick?: string;
  };
  companhias?: CompanhiaInfo[];
}

interface CompanyPermissions {
  isEFB: boolean;
  isSUP: boolean;
  isCOR: boolean;
  hasFullAccess: boolean;
  userCompanies: CompanhiaInfo[];
  isInitialized: boolean;
}

export function useCompanyPermissions(): CompanyPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<CompanyPermissions>({
    isEFB: false,
    isSUP: false,
    isCOR: false,
    hasFullAccess: false,
    userCompanies: [],
    isInitialized: false,
  });

  useEffect(() => {
    if (!user?.email) {
      setPermissions({
        isEFB: false,
        isSUP: false,
        isCOR: false,
        hasFullAccess: false,
        userCompanies: [],
        isInitialized: true,
      });
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    let userProfile: CachedProfileData | null = null;
    const cacheKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("profile_"),
    );

    console.log("[DEBUG] useCompanyPermissions - Iniciando busca de permissões");
    console.log("[DEBUG] user.email:", user.email);
    console.log("[DEBUG] cacheKeys encontradas:", cacheKeys);

    for (const key of cacheKeys) {
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const profileData: CachedProfileData = JSON.parse(cachedData);

          console.log("[DEBUG] Verificando cache:", key);
          console.log("[DEBUG] profileData.militar:", profileData.militar);
          console.log("[DEBUG] profileData.companhias:", profileData.companhias);

          const isMatch =
            profileData.militar?.email === user.email ||
            key.includes(user.email) ||
            (!user.email.includes("@") &&
              profileData.militar?.nick === user.email);

          if (isMatch) {
            console.log("[DEBUG] Match encontrado!");
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

      console.log("[DEBUG] Companhias encontradas:", companhias);

      const isEFB = companhias.some(
        (comp: CompanhiaInfo) =>
          comp.sigla?.toUpperCase() === "EFB" ||
          comp.nome?.toLowerCase().includes("escola") ||
          comp.nome?.toLowerCase().includes("formação"),
      );

      const isSUP = companhias.some(
        (comp: CompanhiaInfo) =>
          comp.sigla?.toUpperCase() === "SUP" ||
          comp.nome?.toLowerCase().includes("supremacia"),
      );

      const isCOR = companhias.some(
        (comp: CompanhiaInfo) =>
          comp.sigla?.toUpperCase() === "COR" ||
          comp.nome?.toLowerCase().includes("corregedoria"),
      );

      const hasFullAccess = isSUP || isCOR;

      console.log("[DEBUG] Permissões calculadas:");
      console.log("[DEBUG] isEFB:", isEFB);
      console.log("[DEBUG] isSUP:", isSUP);
      console.log("[DEBUG] isCOR:", isCOR);
      console.log("[DEBUG] hasFullAccess:", hasFullAccess);

      setPermissions({
        isEFB,
        isSUP,
        isCOR,
        hasFullAccess,
        userCompanies: companhias,
        isInitialized: true,
      });
    } else {
      console.log("[DEBUG] Nenhum perfil encontrado ou sem companhias");
      
      // Aguardar um pouco para o cache ser populado (útil no primeiro login)
      setTimeout(() => {
        const updatedCacheKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith("profile_"),
        );
        
        let foundProfile = false;
        for (const key of updatedCacheKeys) {
          try {
            const cachedData = localStorage.getItem(key);
            if (cachedData) {
              const profileData: CachedProfileData = JSON.parse(cachedData);

              const isMatch =
                profileData.militar?.email === user.email

              if (isMatch && profileData.companhias) {
                const companhias = profileData.companhias || [];
                
                const isEFB = companhias.some(
                  (comp: CompanhiaInfo) =>
                    comp.sigla?.toUpperCase() === "EFB" ||
                    comp.nome?.toLowerCase().includes("escola") ||
                    comp.nome?.toLowerCase().includes("formação"),
                );

                const isSUP = companhias.some(
                  (comp: CompanhiaInfo) =>
                    comp.sigla?.toUpperCase() === "SUP" ||
                    comp.nome?.toLowerCase().includes("supremacia"),
                );

                const isCOR = companhias.some(
                  (comp: CompanhiaInfo) =>
                    comp.sigla?.toUpperCase() === "COR" ||
                    comp.nome?.toLowerCase().includes("corregedoria"),
                );

                const hasFullAccess = isSUP || isCOR;

                console.log("[DEBUG] Permissões encontradas após retry:");
                console.log("[DEBUG] isEFB:", isEFB);
                console.log("[DEBUG] isSUP:", isSUP);
                console.log("[DEBUG] isCOR:", isCOR);

                setPermissions({
                  isEFB,
                  isSUP,
                  isCOR,
                  hasFullAccess,
                  userCompanies: companhias,
                  isInitialized: true,
                });
                foundProfile = true;
                break;
              }
            }
          } catch (error) {
            console.error(`[Permissions] Erro ao processar cache no retry ${key}:`, error);
          }
        }
        
        // Se ainda não encontrou, marcar como inicializado sem permissões
        if (!foundProfile) {
          console.log("[DEBUG] Nenhum perfil encontrado após retry - finalizando sem permissões");
          setPermissions({
            isEFB: false,
            isSUP: false,
            isCOR: false,
            hasFullAccess: false,
            userCompanies: [],
            isInitialized: true,
          });
        }
      }, 500); // Aguardar 500ms para o cache ser populado
    }
  }, [user?.email]);

  return permissions;
}