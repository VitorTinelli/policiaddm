/**
 * Utilitários para gerenciar cache de forma segura
 * Evita armazenar dados sensíveis de outros usuários
 */

export interface CacheUtils {
  clearAllProfileCaches: () => void;
  clearDuplicateProfileCaches: () => void;
  clearOtherUsersCaches: (
    currentUserNick?: string,
    currentUserEmail?: string,
  ) => void;
  isOwnProfile: (
    username: string,
    currentUserNick?: string,
    currentUserEmail?: string,
  ) => boolean;
}

/**
 * Limpa todos os caches de perfis
 */
export function clearAllProfileCaches(): void {
  const keys = Object.keys(localStorage);
  const profileCacheKeys = keys.filter(
    (key) => key.startsWith("profile_") || key.includes("_timestamp"),
  );

  profileCacheKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log(
    `[Cache] Removidos ${profileCacheKeys.length} itens de cache de perfis`,
  );
}

/**
 * Limpa caches duplicados (mesmo perfil com múltiplas entradas)
 */
export function clearDuplicateProfileCaches(): void {
  const keys = Object.keys(localStorage);
  const profileCacheKeys = keys.filter(
    (key) => key.startsWith("profile_") && !key.endsWith("_timestamp"),
  );

  const seenProfiles = new Set<string>();
  let removedCount = 0;

  profileCacheKeys.forEach((key) => {
    const username = key.replace("profile_", "");

    if (seenProfiles.has(username.toLowerCase())) {
      // Perfil duplicado, remover
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      removedCount++;
      console.log(`[Cache] Cache duplicado removido: ${username}`);
    } else {
      seenProfiles.add(username.toLowerCase());
    }
  });

  if (removedCount > 0) {
    console.log(
      `[Cache] Total de caches duplicados removidos: ${removedCount}`,
    );
  }
}

/**
 * Limpa caches de outros usuários, mantendo apenas o do usuário atual
 */
export function clearOtherUsersCaches(
  currentUserNick?: string,
  currentUserEmail?: string,
): void {
  const keys = Object.keys(localStorage);
  const profileCacheKeys = keys.filter(
    (key) => key.startsWith("profile_") && !key.endsWith("_timestamp"),
  );

  let removedCount = 0;

  profileCacheKeys.forEach((key) => {
    const cachedUsername = key.replace("profile_", "");

    // Verificar se é o próprio perfil
    const isOwn = isOwnProfile(
      cachedUsername,
      currentUserNick,
      currentUserEmail,
    );

    if (!isOwn) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      removedCount++;
      console.log(
        `[Cache] Cache removido para outro usuário: ${cachedUsername}`,
      );
    }
  });

  if (removedCount > 0) {
    console.log(
      `[Cache] Total de caches de outros usuários removidos: ${removedCount}`,
    );
  }
}

/**
 * Verifica se o username corresponde ao usuário atual
 */
export function isOwnProfile(
  username: string,
  currentUserNick?: string,
  currentUserEmail?: string,
): boolean {
  if (!username) return false;

  // Verificar por nick
  if (
    currentUserNick &&
    currentUserNick.toLowerCase() === username.toLowerCase()
  ) {
    return true;
  }

  // Verificar por email
  if (
    currentUserEmail &&
    currentUserEmail.toLowerCase() === username.toLowerCase()
  ) {
    return true;
  }

  return false;
}

/**
 * Hook para usar as utilidades de cache de forma consistente
 */
export function useCacheUtils(): CacheUtils {
  return {
    clearAllProfileCaches,
    clearDuplicateProfileCaches,
    clearOtherUsersCaches,
    isOwnProfile,
  };
}
