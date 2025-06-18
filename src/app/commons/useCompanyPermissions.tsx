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

  const calculatePermissions = (companhias: CompanhiaInfo[]) => {
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

    return {
      isEFB,
      isSUP,
      isCOR,
      hasFullAccess,
      userCompanies: companhias,
      isInitialized: true,
    };
  };

  const checkCache = () => {
    const cacheKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("profile_"),
    );

    console.log("[DEBUG] Verificando cache, keys:", cacheKeys);

    for (const key of cacheKeys) {
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const profileData: CachedProfileData = JSON.parse(cachedData);          const isMatch =
            profileData.militar?.email === user?.email ||
            (user?.email && key.includes(user.email)) ||
            (user?.email && !user.email.includes("@") &&
              profileData.militar?.nick === user.email);

          if (isMatch && profileData.companhias) {
            console.log("[DEBUG] Match encontrado no cache!");
            const newPermissions = calculatePermissions(profileData.companhias);
            setPermissions(newPermissions);
            return true;
          }
        }
      } catch (error) {
        console.error(`[Permissions] Erro ao processar cache ${key}:`, error);
      }
    }
    return false;
  };
  const fetchFromAPI = async () => {
    // Verificar se ainda temos um usuário válido antes de fazer a chamada
    if (!user?.email) {
      console.log("[DEBUG] Usuário não encontrado, cancelando busca da API");
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

    console.log("[DEBUG] Buscando dados da API...");
    try {      const response = await fetch(
        `/api/profiles?email=${encodeURIComponent(user.email)}&requestingUserEmail=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar dados do usuário");
      }

      const data = await response.json();
      const companhias = data.data?.companhias || [];

      console.log("[DEBUG] Dados da API recebidos:", companhias);

      const newPermissions = calculatePermissions(companhias);
      setPermissions(newPermissions);      // Armazenar no cache
      const cacheKey = `profile_${user.email}`;
      localStorage.setItem(cacheKey, JSON.stringify(data.data));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error("[DEBUG] Erro ao buscar dados da API:", error);
      setPermissions({
        isEFB: false,
        isSUP: false,
        isCOR: false,
        hasFullAccess: false,
        userCompanies: [],
        isInitialized: true,
      });
    }
  };
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

    let isCancelled = false;

    const loadPermissions = async () => {
      if (isCancelled) return;
      
      console.log("[DEBUG] Iniciando carregamento de permissões para:", user?.email);
      
      // Primeiro, tentar cache imediatamente
      if (checkCache()) {
        return;
      }

      if (isCancelled) return;

      // Aguardar um pouco e tentar novamente
      console.log("[DEBUG] Cache não encontrado, aguardando...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isCancelled) return;
      
      if (checkCache()) {
        return;
      }

      if (isCancelled) return;

      // Se ainda não encontrou, buscar da API
      await fetchFromAPI();
    };

    loadPermissions();

    // Cleanup function para cancelar operações pendentes
    return () => {
      isCancelled = true;
    };
  }, [user?.email]);

  return permissions;
}
