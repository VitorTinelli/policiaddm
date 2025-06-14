import React, { useState, useMemo, memo } from 'react';
import Image from 'next/image';

interface HabboProfilePictureProps {
  username: string;
  size?: 's' | 'm' | 'l';
  headOnly?: boolean;
  direction?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7';
  action?: 'wav' | 'std' | 'crr' | 'sit' | 'lay' | 'wave';
}

export const HabboProfilePicture: React.FC<HabboProfilePictureProps> = memo(({
  username,
  size = 'l',
  headOnly = false,
  direction = '4',
  action = 'std'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const imageUrl = useMemo(() => {
    const baseUrl = 'https://www.habbo.com.br/habbo-imaging/avatarimage';
    const params = new URLSearchParams({
      user: username,
      action: action,
      direction: direction,
      head_direction: '3',
      img_format: 'png',
      gesture: 'sml',
      headonly: headOnly ? '1' : '0',
      size: size,
    });

    return `${baseUrl}?${params.toString()}`;
  }, [username, action, direction, headOnly, size]);

  const handleImageLoad = () => {
    const loadTime = Date.now() - loadStartTime;
    console.log(`✅ Avatar de ${username} carregado em ${loadTime}ms`);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    const loadTime = Date.now() - loadStartTime;
    console.log(`❌ Erro ao carregar avatar de ${username} após ${loadTime}ms`);
    setImageError(true);
    setImageLoaded(false);
  };

  const getSizeClasses = (s: string) => {
    switch (s) {
      case 'l': return 'w-[120px] h-[120px]';
      case 'm': return 'w-16 h-16';
      case 's': return 'w-8 h-8';
      default: return 'w-4 h-4';
    }
  };

  const getSizePixels = (s: string) => {
    switch (s) {
      case 'l': return 120;
      case 'm': return 64;
      case 's': return 32;
      default: return 16;
    }
  };

  const sizeClasses = getSizeClasses(size);
  const sizePixels = getSizePixels(size);

  // Estado de erro - mostrar placeholder
  if (imageError) {
    return (
      <div 
        className={`${sizeClasses} bg-gray-100 flex items-center justify-center border border-gray-300 rounded-md text-gray-500 flex-col text-center`}
        title={`Avatar de ${username} não disponível`}
      >
        <div className={size === 's' ? 'text-sm' : 'text-xl'}>👤</div>
        {sizePixels > 32 && (
          <div className="text-xs mt-0.5">
            {username.substring(0, 6)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses} ${!imageLoaded ? 'bg-gray-100' : 'bg-transparent'} rounded-md overflow-hidden`}>
      {/* Loading indicator */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div 
            className={`border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin ${
              size === 'l' ? 'w-5 h-5' : size === 'm' ? 'w-4 h-4' : 'w-3 h-3'
            }`}
          />
        </div>
      )}

      {/* A imagem usando Next.js Image */}
      <Image
        src={imageUrl}
        alt={`Avatar de ${username}`}
        width={sizePixels}
        height={sizePixels}
        className="object-contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
        unoptimized // Necessário para URLs externas que podem não ser otimizáveis
        priority={false}
      />
    </div>
  );
});

HabboProfilePicture.displayName = 'HabboProfilePicture';