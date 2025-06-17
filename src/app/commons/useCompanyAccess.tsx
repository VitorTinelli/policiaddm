import { useState, useEffect, useCallback } from "react";

interface CompanyAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
}

export function useCompanyAccess(
  userEmail: string | undefined,
  companyCode: number | undefined,
): CompanyAccessResult {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!userEmail || !companyCode) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/profiles?checkCompany=true&email=${encodeURIComponent(userEmail)}&companyId=${companyCode}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao verificar acesso à companhia");
      }

      const data = await response.json();
      setHasAccess(data.isMember || false);
    } catch (err) {
      console.error("Erro ao verificar acesso à companhia:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [userEmail, companyCode]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, error };
}

export default useCompanyAccess;
