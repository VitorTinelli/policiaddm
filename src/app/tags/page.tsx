"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "../commons/AuthContext";
import Header from "../header/Header";
import Footer from "../footer/Footer";

function TagPage() {
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const handleTagChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (value.length > 3) value = value.slice(0, 3);
      setTag(value);

      if (error) setError("");
      if (success) setSuccess("");
    },
    [error, success],
  );

  const isValidTag = useMemo(() => {
    return tag.length === 3;
  }, [tag]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!isValidTag) {
        setError("A TAG deve conter exatamente 3 letras.");
        return;
      }

      if (!session?.access_token) {
        setError("Sessão inválida. Faça login novamente.");
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag, token: session.access_token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erro ao solicitar TAG.");
          return;
        }

        setSuccess("Pedido de TAG enviado com sucesso! Aguarde aprovação.");
        setTag("");
      } catch {
        setError("Erro de conexão. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [tag, isValidTag, session?.access_token],
  );

  return (
    <>
      {" "}
      <Header />
      <div className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gray-50 dark:bg-neutral-900 p-4 lg:p-6">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-yellow-400">
            Criação de TAG
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-yellow-400">
                  <span className="text-xl font-bold text-gray-500 dark:text-gray-400">
                    [
                  </span>
                  <input
                    id="tag"
                    type="text"
                    value={tag}
                    onChange={handleTagChange}
                    placeholder="ABC"
                    maxLength={3}
                    minLength={3}
                    autoComplete="off"
                    disabled={isSubmitting}
                    className="bg-transparent text-xl font-bold text-center w-16 outline-none text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-60"
                    style={{ letterSpacing: "0.1em" }}
                  />
                  <span className="text-xl font-bold text-gray-500 dark:text-gray-400">
                    ]
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Digite exatamente 3 letras maiúsculas
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isValidTag}
              className={`w-full h-10 font-bold border-none rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isSubmitting || !isValidTag
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                  : "bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Enviando...
                </div>
              ) : (
                "Criar TAG"
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md p-3">
                <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">
                  {success}
                </p>
              </div>
            )}
          </form>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              ℹ️ Informações importantes:
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• A TAG deve ter exatamente 3 letras</li>
              <li>• Apenas uma solicitação por vez é permitida</li>
              <li>• Aguarde a aprovação da administração</li>
              <li>• TAGs já em uso não serão aprovadas</li>
              <li>• Consulte o regimento interno para mais informações</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default TagPage;
