"use client";

import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../commons/AuthContext";
import Header from "../header/Header";
import Footer from "../footer/Footer";

type PromotionFormInputs = {
  afetado: string;
  motivo: string;
  permissao?: string;
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PromotionPage = memo(() => {
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const promotionForm = useForm<PromotionFormInputs>();
  const { watch } = promotionForm;

  // Debounce do input para evitar validações excessivas
  const watchedAfetado = watch("afetado", "");
  const debouncedAfetado = useDebounce(watchedAfetado, 300);

  // Validar se o nome é válido (memoizado)
  const isValidName = useMemo(() => {
    return (
      debouncedAfetado.length >= 3 &&
      /^[a-zA-Z0-9\-._]+$/.test(debouncedAfetado)
    );
  }, [debouncedAfetado]);

  const onPromotionSubmit = useCallback(
    async (data: PromotionFormInputs) => {
      setSubmitMessage("");
      setSubmitError("");
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/promotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            afetado: data.afetado,
            motivo: data.motivo,
            permissao: data.permissao || null,
            email: user?.email,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          setSubmitError(result.error || "Falha ao processar promoção");
          return;
        }

        const result = await response.json();
        setSubmitMessage(
          `Promoção registrada com sucesso! ${result.data.afetado} será promovido de ${result.data.patenteAtual} para ${result.data.novaPatente}`,
        );
        promotionForm.reset();
      } catch (error) {
        setSubmitError("Erro de conexão. Tente novamente.");
        console.error("Erro ao processar promoção:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.email, promotionForm],
  );

  return (
    <>
      <Header />
      <div className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gray-50 dark:bg-neutral-900 p-4 lg:p-6">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Promoções
          </h1>

          <form
            onSubmit={promotionForm.handleSubmit(onPromotionSubmit)}
            className="space-y-6"
          >
            {/* Nick do Militar */}
            <div className="space-y-2">
              <label
                htmlFor="afetado"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nick do Militar:
              </label>
              <input
                id="afetado"
                {...promotionForm.register("afetado", {
                  required: "Nick do militar é obrigatório",
                  minLength: {
                    value: 3,
                    message: "Nick deve ter pelo menos 3 caracteres",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9\-._]+$/,
                    message: "Nick contém caracteres inválidos",
                  },
                })}
                placeholder="Digite o nick do militar"
                disabled={isSubmitting}
                className={`w-full h-10 px-3 border rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isValidName
                    ? "border-green-500 dark:border-green-400"
                    : watchedAfetado && !isValidName
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {promotionForm.formState.errors.afetado && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {promotionForm.formState.errors.afetado.message}
                </p>
              )}
              {watchedAfetado && isValidName && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-1 font-medium">
                  ✓ Nick válido
                </p>
              )}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label
                htmlFor="motivoPromocao"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Motivo:
              </label>
              <textarea
                id="motivoPromocao"
                {...promotionForm.register("motivo", {
                  required: "Motivo é obrigatório",
                  minLength: {
                    value: 10,
                    message: "Motivo deve ter pelo menos 10 caracteres",
                  },
                })}
                placeholder="Descreva o motivo da promoção"
                rows={4}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed resize-vertical"
              />
              {promotionForm.formState.errors.motivo && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {promotionForm.formState.errors.motivo.message}
                </p>
              )}
            </div>

            {/* Permissão (Opcional) */}
            <div className="space-y-2">
              <label
                htmlFor="permissao"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Permissão (Opcional):
              </label>
              <input
                id="permissao"
                {...promotionForm.register("permissao")}
                placeholder="Caso necessário, informações sobre permissão"
                disabled={isSubmitting}
                className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isValidName}
              className={`w-full h-10 font-bold border-none rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isSubmitting || !isValidName
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                  : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </div>
              ) : (
                "Registrar Promoção"
              )}
            </button>
          </form>

          {/* Success Message */}
          {submitMessage && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">
                {submitMessage}
              </p>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                {submitError}
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              ℹ️ Informações sobre promoções:
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>
                • O militar será promovido automaticamente para a próxima
                patente na hierarquia
              </li>
              <li>• Apenas militares ativos podem ser promovidos</li>
              <li>• Não é possível promover militar com promoção pendente</li>
              <li>
                • A promoção ficará pendente até aprovação da administração
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
});

PromotionPage.displayName = "PromotionPage";

export default PromotionPage;
