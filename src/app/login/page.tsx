'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../commons/AuthContext';
import Link from 'next/link';

type LoginFormInputs = {
  username: string;
  password: string;
};

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn } = useAuth();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormInputs) => {
    setLoginError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await signIn(data.username, data.password);

      if (result.error) {
        setLoginError(result.error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Não renderizar se já estiver logado
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4 lg:p-4 md:p-2 sm:p-1">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-8 md:p-6 sm:p-6 w-full max-w-md lg:max-w-lg md:max-w-md sm:max-w-none sm:mx-2">
        <div className="text-center mb-8 lg:mb-8 md:mb-6 sm:mb-6">
          <h1 className="text-3xl lg:text-3xl md:text-2xl sm:text-xl font-bold text-black dark:text-yellow-400 mb-2">
            SGD/DDM
          </h1>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm mb-4 text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-base lg:text-base md:text-sm sm:text-sm font-medium text-gray-700 dark:text-white mb-1">
              Nickname:
            </label>
            <input
              id="username"
              {...register('username', { required: 'Nickname é obrigatório' })}
              className="w-full h-10 lg:h-10 md:h-11 sm:h-12 text-base lg:text-base md:text-sm sm:text-sm border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Digite seu nickname"
            />
            {errors.username && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-base lg:text-base md:text-sm sm:text-sm font-medium text-gray-700 dark:text-white mb-1">
              Senha:
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { required: 'Senha é obrigatória' })}
              className="w-full h-10 lg:h-10 md:h-11 sm:h-12 text-base lg:text-base md:text-sm sm:text-sm border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Digite sua senha"
            />
            {errors.password && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {loginError && (
            <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center">
              {loginError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 lg:gap-2 md:gap-3 sm:gap-3">
            <Link 
              href="/register"
              className="flex-1 w-full h-10 lg:h-10 md:h-11 sm:h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-md transition-colors duration-200 flex items-center justify-center text-center text-base lg:text-base md:text-sm sm:text-sm">
              Registrar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 w-full h-10 lg:h-10 md:h-11 sm:h-12 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-black disabled:dark:text-gray-400 font-bold rounded-md transition-colors duration-200 disabled:cursor-not-allowed text-base lg:text-base md:text-sm sm:text-sm">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>        
        <div className="text-center mt-4 lg:mt-4 md:mt-6 sm:mt-6">
          <Link 
            href="/forgotPassword" 
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:underline transition-all text-sm lg:text-sm md:text-sm sm:text-sm">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}