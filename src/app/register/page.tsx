"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../commons/AuthContext";
import { confirmCode } from "./ConfirmCode";
import Link from "next/link";

type StepType = "nick" | "credentials";

export default function RegisterPage() {
  const [step, setStep] = useState<StepType>("nick");
  const [nick, setNick] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleNickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick.trim()) {
      setError("Nickname é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/register/check-nick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nick }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "already_registered") {
          alert("Você já está registrado. Retornando para tela de login.");
          router.push("/login");
          return;
        }
        setError(data.error);
        return;
      }

      setCode(data.code);
    } catch {
      setError("Erro ao verificar nickname");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await confirmCode(nick, code);

      if (!result.success) {
        setError(result.error || "Erro ao confirmar código");
        return;
      }

      setStep("credentials");
    } catch {
      setError("Erro ao confirmar código");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nick, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      router.push("/");
    } catch {
      setError("Erro ao registrar usuário");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null;
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-neutral-900">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 w-full max-w-md">
        {step === "nick" && (
          <form onSubmit={handleNickSubmit}>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-yellow-400">
              Etapa 1: Verifique seu Habbo
            </h2>

            <div className="mb-4">
              <label
                htmlFor="nick"
                className="block text-base font-medium text-gray-700 dark:text-white mb-2"
              >
                Nickname Habbo:
              </label>
              <input
                id="nick"
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Digite seu nickname"
                disabled={loading}
                className="w-full text-base h-10 border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>

            {!code ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-bold rounded-md transition-colors duration-200 disabled:cursor-not-allowed mt-8"
              >
                {loading ? "Verificando..." : "Gerar Código"}
              </button>
            ) : (
              <div className="mt-6">
                <p className="text-gray-700 dark:text-white mb-2">
                  Defina este código como sua missão no Habbo:
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
                  <strong className="text-yellow-800 dark:text-yellow-400 text-lg">
                    {code}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full h-10 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-bold rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center mt-4">
                {error}
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full h-10 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}

        {step === "credentials" && (
          <form onSubmit={handleRegister}>
            <h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-yellow-400">
              Etapa 2: Crie suas credenciais
            </h2>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-base font-medium text-gray-700 dark:text-white mb-2"
              >
                Email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                disabled={loading}
                className="w-full text-base h-10 border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-base font-medium text-gray-700 dark:text-white mb-2"
              >
                Senha:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={loading}
                className="w-full text-base h-10 border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-base font-medium text-gray-700 dark:text-white mb-2"
              >
                Confirmar Senha:
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                disabled={loading}
                className="w-full text-base h-10 border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-bold rounded-md transition-colors duration-200 disabled:cursor-not-allowed mt-8"
            >
              {loading ? "Registrando..." : "Registrar"}
            </button>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center mt-4">
                {error}
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full h-10 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
