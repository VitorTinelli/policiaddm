"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "../../commons/useRequireAuth";
import { useCompanyPermissions } from "../../commons/useCompanyPermissions";
import Header from "../../header/Header";
import Footer from "../../footer/Footer";
import { getCourseScript as getScript } from "../courseScripts";

interface Company {
  id: number;
  sigla: string;
  nome: string;
}

interface Course {
  id: number;
  sigla: string;
  nome: string;
  obrigatorio: boolean;
  patente: number;
}

interface ScriptData {
  company: Company;
  courses: Course[];
}

export default function CompanyScriptsPage() {
  const params = useParams();
  const companhia = params.companhia as string;

  const { user, loading: authLoading } = useRequireAuth();
  const permissions = useCompanyPermissions();
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingScript, setLoadingScript] = useState(false);
  const [error, setError] = useState("");

  const availableCompanies = {
    EFB: "Escola de Formação Básica",
  };
  // Verificar se o usuário tem acesso a esta companhia
  const hasAccessToCompany = useCallback(
    (company: string) => {
      const companyLower = company?.toLowerCase();

      // Acesso total para SUP e COR
      if (permissions.hasFullAccess) return true;

      // Acesso específico para EFB
      if (companyLower === "efb" && permissions.isEFB) return true;

      return false;
    },
    [permissions],
  );
  const patentesMap = useMemo(
    (): Record<number, string> => ({
      1: "Soldado",
      2: "Cabo",
      3: "Sargento",
      4: "Subtenente",
      5: "Aspirante a Oficial",
      6: "Tenente",
      7: "Capitão",
      8: "Major",
      9: "Coronel",
      10: "General",
      11: "Marechal",
      12: "Comandante",
      13: "Comandante-Geral",
    }),
    [],
  );
  const getPatenteName = useCallback(
    (patenteId: number): string => {
      return patentesMap[patenteId] || `Patente ${patenteId}`;
    },
    [patentesMap],
  );

  const fetchCourses = useCallback(async () => {
    if (!companhia) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/courses?company=${companhia.toUpperCase()}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar cursos");
      }

      const data: ScriptData = await response.json();
      setCompanyData(data.company);
      setCourses(data.courses || []);
      setError("");
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setError("Erro ao carregar cursos da companhia");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [companhia]);
  const generateScript = useCallback(
    (course: Course) => {
      if (!companyData || !user?.email) return "";
      const specificScript = getScript(course.sigla);
      if (specificScript.length > 0) {
        return "COURSE_SCRIPT";
      }

      // Para cursos sem script específico, retornar mensagem padrão
      return "NO_SCRIPT_AVAILABLE";
    },
    [companyData, user?.email],
  );
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setLoadingScript(true);

    // Simular carregamento do script
    setTimeout(() => {
      const generatedScript = generateScript(course);
      setScript(generatedScript);
      setLoadingScript(false);
    }, 500);
  };

  const copyPhrase = async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Copiado!";
        button.classList.add("bg-green-500", "hover:bg-green-600");
        button.classList.remove("bg-gray-500", "hover:bg-gray-600");
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("bg-green-500", "hover:bg-green-600");
          button.classList.add("bg-gray-500", "hover:bg-gray-600");
        }, 1000);
      }
    } catch (err) {
      console.error("Erro ao copiar frase:", err);
      alert("Erro ao copiar frase. Tente selecionar e copiar manualmente.");
    }
  };
  useEffect(() => {
    if (companhia && hasAccessToCompany(companhia)) {
      fetchCourses();
    }
  }, [companhia, hasAccessToCompany, fetchCourses]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  // Verificar se a companhia existe
  const companyName =
    availableCompanies[
      companhia?.toUpperCase() as keyof typeof availableCompanies
    ];

  if (!companyName) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              <strong>Erro:</strong> Companhia &apos;{companhia}&apos; não
              encontrada.
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Verificar se o usuário tem acesso à companhia
  if (!hasAccessToCompany(companhia)) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-6 py-4 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <strong>Acesso Negado</strong>
                  <p className="mt-1">
                    Você não faz parte da {companyName}. Apenas militares da{" "}
                    {companhia?.toUpperCase()} podem acessar esta área.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho da página */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Scripts - {companhia?.toUpperCase()}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {companyName} - Selecione um curso para gerar o script de
              aplicação.
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-8">
              <strong>Erro:</strong> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seleção de Cursos */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Cursos Disponíveis
                </h2>

                {/* Loading */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Carregando cursos...
                    </p>
                  </div>
                )}

                {/* Lista de Cursos */}
                {!loading && courses.length > 0 && (
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleCourseSelect(course)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedCourse?.id === course.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {course.sigla}
                          </h3>
                          {course.obrigatorio && (
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded">
                              Obrigatório
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          {course.nome}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Patente mínima: {getPatenteName(course.patente)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Estado vazio */}
                {!loading && courses.length === 0 && !error && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum curso encontrado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Não há cursos disponíveis para esta companhia.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Script Gerado */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                {!selectedCourse && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Selecione um Curso
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Escolha um curso na lista ao lado para gerar o script.
                    </p>
                  </div>
                )}
                {loadingScript && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Gerando script...
                    </p>
                  </div>
                )}{" "}
                {script && !loadingScript && (
                  <div className="space-y-4">
                    <div className="bg-gray-100 dark:bg-neutral-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {selectedCourse?.sigla} - {selectedCourse?.nome}
                        </h4>
                      </div>
                    </div>
                    {/* Script específico do curso (CFI/CFC) */}
                    {script === "COURSE_SCRIPT" && selectedCourse && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Script do Curso {selectedCourse.sigla}
                          </h4>
                        </div>{" "}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {getScript(selectedCourse.sigla).map(
                            (phrase, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-neutral-700 rounded border"
                              >
                                <div className="flex-grow text-sm text-gray-900 dark:text-gray-100 font-mono">
                                  {phrase || (
                                    <span className="text-gray-400 italic">
                                      (linha vazia)
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => copyPhrase(phrase)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors duration-200 flex-shrink-0"
                                  title="Copiar frase"
                                >
                                  Copiar
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}{" "}
                    {/* Curso não disponível */}
                    {script !== "COURSE_SCRIPT" && selectedCourse && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                          Curso ainda não disponível no sistema
                        </h4>
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                          Este curso ainda não está disponível no sistema.
                          Acesse o fórum para aplicar a aula.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
