'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ResetPasswordInputs = {
  password: string;
  confirmPassword: string;
};

function ResetPasswordForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordInputs>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const password = watch('password');

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordInputs) => {
    setLoading(true);
    setMessage('');
    setError('');

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError('Token de recuperação não encontrado. Solicite um novo link.');
      setLoading(false);
      return;
    }

    try { const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          password: data.password,
          accessToken,
          refreshToken,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Senha alterada com sucesso! Redirecionando para o login...');
        setTimeout(() => {
          router.push('/login?message=Senha alterada com sucesso! Faça login com sua nova senha.');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError('Erro interno. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4 lg:p-4 md:p-2 sm:p-1">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-8 md:p-6 sm:p-6 w-full max-w-md lg:max-w-lg md:max-w-md sm:max-w-none sm:mx-2">
        <div className="text-center mb-8 lg:mb-8 md:mb-6 sm:mb-6">
          <h1 className="text-3xl lg:text-3xl md:text-2xl sm:text-xl font-bold text-black dark:text-yellow-400 mb-2">
            Redefinir Senha
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-sm md:text-sm sm:text-sm">
            Digite sua nova senha
          </p>
        </div>        {message && (
          <div className="bg-green-100 border border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm mb-4 text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}        {!error.includes('Link de recuperação inválido') && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-base lg:text-base md:text-sm sm:text-sm font-medium text-gray-700 dark:text-white mb-1">
                Nova Senha:
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter pelo menos 6 caracteres'
                  }
                })}
                className="w-full h-10 lg:h-10 md:h-11 sm:h-12 text-base lg:text-base md:text-sm sm:text-sm border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              {errors.password && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-base lg:text-base md:text-sm sm:text-sm font-medium text-gray-700 dark:text-white mb-1">
                Confirmar Nova Senha:
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value => value === password || 'As senhas não coincidem'
                })}
                className="w-full h-10 lg:h-10 md:h-11 sm:h-12 text-base lg:text-base md:text-sm sm:text-sm border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                placeholder="Confirme sua nova senha"
                disabled={loading}
              />
              {errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 lg:h-10 md:h-11 sm:h-12 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-black disabled:dark:text-gray-400 font-bold rounded-md transition-colors duration-200 disabled:cursor-not-allowed text-base lg:text-base md:text-sm sm:text-sm"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        )}        <div className="text-center mt-4 lg:mt-4 md:mt-6 sm:mt-6">
          <Link 
            href="/login" 
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:underline transition-all text-sm lg:text-sm md:text-sm sm:text-sm"
          >
            ← Voltar ao Login
          </Link>
        </div>
        
        {error.includes('Link de recuperação inválido') && (
          <div className="text-center mt-2">
            <Link 
              href="/forgot-password" 
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:underline transition-all text-sm"
            >
              Solicitar novo link de recuperação
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
