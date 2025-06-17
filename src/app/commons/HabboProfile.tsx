import { useState, useEffect } from "react";

interface HabboBadge {
  badgeIndex: number;
  code: string;
  name?: string;
  description?: string;
}

export interface HabboProfile {
  uniqueId: string;
  name: string;
  figureString: string;
  motto: string;
  online: boolean;
  lastAccessTime: string;
  memberSince: string;
  profileVisible: boolean;
  currentLevel: number;
  currentLevelCompletePercent: number;
  totalExperience: number;
  starGemCount: number;
  selectedBadges: HabboBadge[];
}

const API_CONFIG = {
  timeout: 10000,
  retries: 2,
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; HabboProfileFetcher/1.0)",
  },
} as const;

export async function getHabboProfile(name: string): Promise<HabboProfile> {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Nome é obrigatório e deve ser uma string válida");
  }

  const cleanName = name.trim();

  const urls = [
    `https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(cleanName)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(cleanName)}`,
    )}`,
    `https://www.habbo.com/api/public/users?name=${encodeURIComponent(cleanName)}`,
  ];

  let lastError: Error | null = null;

  for (let attemptIndex = 0; attemptIndex < urls.length; attemptIndex++) {
    try {
      console.log(
        `Tentativa ${attemptIndex + 1}: Buscando perfil de "${cleanName}"...`,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.timeout,
      );

      const response = await fetch(urls[attemptIndex], {
        method: "GET",
        headers: API_CONFIG.headers,
        signal: controller.signal,
        next: { revalidate: 300 },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Usuário "${cleanName}" não encontrado no Habbo`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data = await response.json();

      if (attemptIndex === 1 && data.contents) {
        try {
          data = JSON.parse(data.contents);
        } catch {
          throw new Error("Erro ao processar resposta do proxy");
        }
      }

      if (!data || typeof data !== "object") {
        throw new Error("Dados inválidos recebidos da API");
      }

      if (!data.uniqueId || !data.name) {
        throw new Error("Resposta da API não contém dados válidos do perfil");
      }

      console.log(`Perfil de "${cleanName}" encontrado com sucesso`);

      const profile: HabboProfile = {
        uniqueId: data.uniqueId,
        name: data.name,
        figureString: data.figureString || "",
        motto: data.motto || "",
        online: Boolean(data.online),
        lastAccessTime: data.lastAccessTime || "",
        memberSince: data.memberSince || "",
        profileVisible: Boolean(data.profileVisible),
        currentLevel: Number(data.currentLevel) || 0,
        currentLevelCompletePercent:
          Number(data.currentLevelCompletePercent) || 0,
        totalExperience: Number(data.totalExperience) || 0,
        starGemCount: Number(data.starGemCount) || 0,
        selectedBadges: Array.isArray(data.selectedBadges)
          ? data.selectedBadges
          : [],
      };

      return profile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      lastError = new Error(errorMessage);

      console.warn(
        `Tentativa ${attemptIndex + 1} falhou para "${cleanName}":`,
        errorMessage,
      );

      if (attemptIndex === urls.length - 1) {
        break;
      }

      if (attemptIndex < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  const finalError = new Error(
    `Não foi possível buscar o perfil do usuário "${cleanName}". ${
      lastError?.message || "Todas as tentativas falharam"
    }`,
  );

  console.error("Erro final:", finalError.message);
  throw finalError;
}

export function useHabboProfile(name: string | null) {
  const [profile, setProfile] = useState<HabboProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setProfile(null);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileData = await getHabboProfile(name);
        if (!isCancelled) {
          setProfile(profileData);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
          setProfile(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [name]);

  return { profile, loading, error };
}

export function isValidHabboUsername(name: string): boolean {
  if (!name || typeof name !== "string") return false;

  const cleanName = name.trim();
  const habboNameRegex = /^[a-zA-Z0-9_-]{3,15}$/;

  return habboNameRegex.test(cleanName);
}
