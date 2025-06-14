'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../commons/AuthContext';

const Header = memo(() => {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { signOut } = useAuth();

  const navigateToProfile = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim() !== '') {
      router.push(`/profile/${search}`);
    }
  }, [search, router]);

  const handleLogout = useCallback(() => {
    signOut();
  }, [signOut]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  return (
    <header className="flex justify-between items-center bg-white dark:bg-neutral-800 shadow-lg min-h-[8vh] px-4 sm:px-6 md:px-4 lg:px-6 py-0 sm:min-h-[10vh] md:min-h-[12vh] lg:min-h-[8vh] sm:flex-wrap sm:gap-3 md:flex-col md:items-stretch md:gap-4 lg:flex-row lg:items-center lg:gap-0">
      
      <Link 
        href="/" 
        className="text-inherit no-underline transition-opacity duration-200 hover:opacity-80 md:self-center"
      >
        <div className="flex items-center gap-4 sm:gap-3 md:justify-center md:flex-wrap md:gap-2 lg:justify-start lg:flex-nowrap lg:gap-4">
          <Image
            src="/ddmLogo.png"
            alt="Logo"
            width={40}
            height={40}
            className="w-auto h-auto"
            priority
          />
          <h1 className="text-2xl sm:text-xl md:text-lg md:text-center lg:text-2xl lg:text-left font-bold m-0 text-black dark:text-yellow-400">
            Departamento de Desenvolvimento Militar
          </h1>
        </div>
      </Link>
      
      <div className="flex items-center gap-4 sm:gap-3 md:justify-center md:flex-wrap md:gap-4 lg:gap-4">
        <form 
          onSubmit={navigateToProfile} 
          className="flex items-center gap-2 md:flex-1 md:max-w-[300px]"
        >
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={handleSearchChange}
            className="w-[200px] sm:w-[180px] md:w-[160px] md:flex-1 md:h-10 lg:w-[200px] lg:h-auto border border-gray-300 dark:border-gray-500 p-2 rounded-md outline-none transition-shadow duration-200 bg-white dark:bg-gray-700 text-black dark:text-white focus:shadow-[0_0_0_2px_#ffeb3b] focus:border-yellow-400 text-sm md:text-xs lg:text-sm md:h-11 sm:h-10 lg:h-auto"
          />
          <button 
            type="submit" 
            title="Buscar perfil"
            className="bg-yellow-400 hover:bg-yellow-500 border-none p-2 px-3 rounded-md cursor-pointer text-base transition-colors duration-200 flex items-center justify-center md:h-10 md:min-w-[44px] lg:h-auto sm:h-10 lg:min-w-0 md:h-11 lg:text-base md:text-sm lg:p-2 lg:px-3 md:p-2"
          >
            🔍
          </button>
        </form>
        
        <button 
          className="bg-red-500 hover:bg-red-600 text-white border-none p-2 px-3 rounded-md cursor-pointer text-base transition-colors duration-200 flex items-center justify-center md:h-10 md:min-w-[44px] lg:h-auto sm:h-10 lg:min-w-0 md:h-11 lg:text-base md:text-sm lg:p-2 lg:px-3 md:p-2"
          onClick={handleLogout}
          title="Sair"
        >
          🚪
        </button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;