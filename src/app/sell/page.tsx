"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRequireAuth } from "../commons/useRequireAuth";
import { useCompanyPermissions } from "../commons/useCompanyPermissions";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { PATENTES_DISPONIVEIS } from "../commons/Patentes";

interface SellFormInputs {
  nickComprador: string;
  patenteComprada: string;
}

interface Militar {
  id: string;
  nick: string;
  patente: number;
  patente_nome?: string;
  ativo: boolean;
  tag?: string;
}

interface ProfileData {
  militar: Militar;
}

export default function SellPage() {
  const { user } = useRequireAuth();
  const permissions = useCompanyPermissions();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sellForm = useForm<SellFormInputs>();
  const { watch, reset } = sellForm;

  const watchedNick = watch("nickComprador", "");
  const watchedPatente = watch("patenteComprada", "");

  // Buscar dados do próprio usuário para pegar informações do vendedor
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(
          `/api/profiles?email=${encodeURIComponent(user.email)}&requestingUserEmail=${encodeURIComponent(user.email)}`
        );
        if (response.ok) {
          const data = await response.json();
          setProfileData(data.data);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
      }
    };

    fetchUserProfile();
  }, [user?.email]);

  const onSubmit = useCallback(
    async (data: SellFormInputs) => {
      setSubmitMessage("");
      setSubmitError("");
      setIsSubmitting(true);

      try {
        if (!profileData?.militar?.tag) {
          setSubmitError("Erro: Não foi possível obter sua TAG. Contate um administrador.");
          setIsSubmitting(false);
          return;
        }

        const response = await fetch("/api/rank-requirements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "sell",
            nickComprador: data.nickComprador.trim(),
            patenteComprada: parseInt(data.patenteComprada),
            vendedorEmail: user?.email,
            vendedorTag: profileData.militar.tag,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setSubmitMessage(`Venda realizada com sucesso! ${result.message || ""}`);
          reset();
        } else {
          setSubmitError(result.error || "Erro ao processar venda.");
        }
      } catch (error) {
        console.error("Erro ao realizar venda:", error);
        setSubmitError("Erro de conexão. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.email, profileData, reset],
  );

  // Verificar se o sistema está carregando
  if (!permissions.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
          <div className="text-gray-900 dark:text-white text-xl">Carregando permissões...</div>
        </div>
      </div>
    );
  }

  // Verificar se o usuário tem permissão para vender cargos
  if (!permissions.hasFullAccess && !permissions.isEFB) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gray-50 dark:bg-neutral-900 p-4">
          <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
            <div className="text-red-500 text-6xl mb-6">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Acesso Negado
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Você não tem permissão para acessar esta funcionalidade.
            </p>
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                📋 Permissões necessárias:
              </p>
              <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1 text-left">
                <li>• Membro do Estado Maior (Supremacia)</li>
                <li>• Instrutor da Escola de Formação Básica (EFB)</li>
              </ul>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gray-50 dark:bg-neutral-900 p-4 lg:p-6">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            {/* Mensagens de feedback */}
            {submitMessage && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center">
                  <div className="text-green-500 text-xl mr-3">✅</div>
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    {submitMessage}
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-500 text-xl mr-3">❌</div>
                  <p className="text-red-700 dark:text-red-300 font-medium">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={sellForm.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nick do Comprador */}
              <div className="space-y-2">
                <label
                  htmlFor="nickComprador"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nick do Comprador <span className="text-red-500">*</span>
                </label>
                <input
                  id="nickComprador"
                  type="text"
                  {...sellForm.register("nickComprador", {
                    required: "Nick do comprador é obrigatório",
                    minLength: {
                      value: 3,
                      message: "Nick deve ter pelo menos 3 caracteres",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9\-._]+$/,
                      message: "Nick contém caracteres inválidos",
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-neutral-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                           placeholder-gray-500 dark:placeholder-gray-400
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200"
                  placeholder="Digite o nick do comprador"
                  disabled={isSubmitting}
                />
                {sellForm.formState.errors.nickComprador && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                    <span className="mr-1">⚠️</span>
                    {sellForm.formState.errors.nickComprador.message}
                  </p>
                )}
              </div>

              {/* Patente Comprada */}
              <div className="space-y-2">
                <label
                  htmlFor="patenteComprada"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Patente Comprada <span className="text-red-500">*</span>
                </label>
                <select
                  id="patenteComprada"
                  {...sellForm.register("patenteComprada", {
                    required: "Selecione uma patente",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-neutral-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200"
                  disabled={isSubmitting}
                >
                  <option value="">Selecione uma patente</option>
                  {PATENTES_DISPONIVEIS.map((patente) => (
                    <option key={patente.id} value={patente.id}>
                      {patente.patente}
                    </option>
                  ))}
                </select>
                {sellForm.formState.errors.patenteComprada && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                    <span className="mr-1">⚠️</span>
                    {sellForm.formState.errors.patenteComprada.message}
                  </p>
                )}
              </div>



              {/* Informações do Vendedor */}
              {profileData && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                    <span className="mr-2">ℹ️</span>
                    Informações da Venda
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">Vendedor:</span>
                      <span className="text-blue-800 dark:text-blue-300">{profileData.militar?.nick || "Carregando..."}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">TAG:</span>
                      <span className="text-blue-800 dark:text-blue-300 font-mono">{profileData.militar?.tag || "Carregando..."}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo da Operação */}
              {watchedNick && watchedPatente && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
                    <span className="mr-2">📋</span>
                    Resumo da Operação
                  </h3>
                  <div className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                    <p><strong>Comprador:</strong> {watchedNick}</p>
                    <p><strong>Nova Patente:</strong> {PATENTES_DISPONIVEIS.find(p => p.id === parseInt(watchedPatente))?.patente || "Não selecionada"}</p>
                    <p><strong>Resultado:</strong> {watchedNick} {watchedNick ? "receberá" : ""} a patente selecionada</p>
                  </div>
                </div>
              )}

              {/* Botão de Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !profileData || !watchedNick || !watchedPatente}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  isSubmitting || !profileData || !watchedNick || !watchedPatente
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    Processando Venda...
                  </>
                ) : (
                  <>
                    Enviar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
