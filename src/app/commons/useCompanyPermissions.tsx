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
}

export function useCompanyPermissions(): CompanyPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<CompanyPermissions>({
    isEFB: false,
    isSUP: false,
    isCOR: false,
    hasFullAccess: false,
    userCompanies: [],
  });
  useEffect(() => {
    if (!user?.email) {
      setPermissions({
        isEFB: false,
        isSUP: false,
        isCOR: false,
        hasFullAccess: false,
        userCompanies: [],
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

    for (const key of cacheKeys) {
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const profileData: CachedProfileData = JSON.parse(cachedData);

          const isMatch =
            profileData.militar?.email === user.email ||
            key.includes(user.email) ||
            (!user.email.includes("@") &&
              profileData.militar?.nick === user.email);

          if (isMatch) {
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

      setPermissions({
        isEFB,
        isSUP,
        isCOR,
        hasFullAccess,
        userCompanies: companhias,
      });
    } else {
      setPermissions({
        isEFB: false,
        isSUP: false,
        isCOR: false,
        hasFullAccess: false,
        userCompanies: [],
      });
    }
  }, [user?.email]);

  return permissions;
}
