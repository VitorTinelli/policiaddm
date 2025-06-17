export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-center bg-white dark:bg-neutral-800 shadow-[0_-2px_15px_rgba(0,0,0,0.1)] text-center min-h-[8vh] sm:min-h-[10vh] md:min-h-[12vh] lg:min-h-[8vh] px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-2 lg:py-4">
      <h1 className="m-1 text-xs sm:text-[0.7rem] md:text-[0.65rem] lg:text-xs text-black dark:text-yellow-400 leading-normal sm:leading-relaxed">
        Desenvolvido por DDMDev
      </h1>
      <h1 className="m-1 text-xs sm:text-[0.7rem] md:text-[0.65rem] lg:text-xs text-black dark:text-yellow-400 leading-normal sm:leading-relaxed">
        © Policia DDM
      </h1>
    </footer>
  );
}
