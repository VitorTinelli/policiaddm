"use client";

import { useAuth } from "../commons/AuthContext";
import { useCompanyPermissions } from "../commons/useCompanyPermissions";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompanyDebugPage() {
  const router = useRouter();
  const { user } = useAuth();
  const permissions = useCompanyPermissions();
  const [profileCacheKeys, setProfileCacheKeys] = useState<string[]>([]);

  // Verificar ambiente e redirecionar se necessário
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AMBIENTE !== "preview") {
      router.push("/");
      return;
    }
  }, [router]);

  // Carregar chaves do cache
  useEffect(() => {
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("profile_"),
      );
      setProfileCacheKeys(keys);
    }
  }, []);

  // Se não for preview, não renderizar nada enquanto redireciona
  if (process.env.NEXT_PUBLIC_AMBIENTE !== "preview") {
    return null;
  }

  const handleTestAPI = async () => {
    if (!user?.email) {
      alert("Usuário não está logado ou não tem email");
      return;
    }

    try {
      const response = await fetch(
        `/api/profiles?email=${encodeURIComponent(user.email)}&requestingUserEmail=${encodeURIComponent(user.email)}`,
      );
      const data = await response.json();

      console.log("Resposta da API:", data);
      alert("Verifique o console para ver a resposta completa da API");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao buscar dados da API");
    }
  };

  const handleClearCache = () => {
    if (typeof window === "undefined") {
      return;
    }

    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("profile_"),
    );
    keys.forEach((key) => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });
    setProfileCacheKeys([]);
    alert(`Cache limpo para ${keys.length} perfis`);
    window.location.reload();
  };

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-160px)] bg-gray-50 dark:bg-neutral-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Debug - Permissões de Companhia
            </h1>

            {/* Informações do usuário */}
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">
                Usuário Logado
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Email:</strong> {user?.email || "Não disponível"}
                </div>
                <div>
                  <strong>ID:</strong> {user?.id || "Não disponível"}
                </div>
              </div>
            </div>

            {/* Permissões detectadas */}
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <h2 className="text-xl font-bold text-green-900 dark:text-green-100 mb-4">
                Permissões Detectadas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>EFB:</strong>
                  <span
                    className={
                      permissions.isEFB ? "text-green-600" : "text-red-600"
                    }
                  >
                    {permissions.isEFB ? " ✅" : " ❌"}
                  </span>
                </div>
                <div>
                  <strong>SUP:</strong>
                  <span
                    className={
                      permissions.isSUP ? "text-green-600" : "text-red-600"
                    }
                  >
                    {permissions.isSUP ? " ✅" : " ❌"}
                  </span>
                </div>
                <div>
                  <strong>COR:</strong>
                  <span
                    className={
                      permissions.isCOR ? "text-green-600" : "text-red-600"
                    }
                  >
                    {permissions.isCOR ? " ✅" : " ❌"}
                  </span>
                </div>
                <div>
                  <strong>Acesso Total:</strong>
                  <span
                    className={
                      permissions.hasFullAccess
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {permissions.hasFullAccess ? " ✅" : " ❌"}
                  </span>
                </div>
              </div>
            </div>

            {/* Companhias do usuário */}
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">
                Companhias no Cache
              </h2>
              {permissions.userCompanies.length > 0 ? (
                <div className="space-y-2">
                  {permissions.userCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="p-2 bg-white dark:bg-gray-700 rounded border"
                    >
                      <div>
                        <strong>Nome:</strong> {company.nome}
                      </div>
                      <div>
                        <strong>Sigla:</strong> {company.sigla}
                      </div>
                      <div>
                        <strong>ID:</strong> {company.id}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-700 dark:text-yellow-300">
                  Nenhuma companhia encontrada no cache
                </p>
              )}
            </div>

            {/* Cache de perfis */}
            <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4">
                Perfis no Cache
              </h2>{" "}
              <div className="text-sm space-y-1">
                {profileCacheKeys.map((key) => (
                  <div key={key} className="font-mono">
                    {key}
                  </div>
                ))}
              </div>
              {profileCacheKeys.length === 0 && (
                <p className="text-purple-700 dark:text-purple-300">
                  Nenhum perfil no cache
                </p>
              )}
            </div>

            {/* Ações de debug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleTestAPI}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Testar API
              </button>
              <button
                onClick={handleClearCache}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Limpar Cache
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
