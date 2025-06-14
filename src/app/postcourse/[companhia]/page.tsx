'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../commons/AuthContext';
import Header from '../../header/Header';
import Footer from '../../footer/Footer';

interface Course {
    id: number;
    sigla: string;
    nome: string;
    obrigatorio: boolean;
    patente: number;
}

interface Company {
    id: number;
    sigla: string;
    nome: string;
}

interface CompanyCoursesData {
    company: Company;
    courses: Course[];
}

function CompanyCoursePages() {
    const params = useParams();
    const companyParam = params.companhia as string;
    
    const [companyData, setCompanyData] = useState<CompanyCoursesData | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [courseStudent, setCourseStudent] = useState('');
    const [courseDate, setCourseDate] = useState('');
    const [courseTime, setCourseTime] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const { user } = useAuth();
    const email = user?.email;

    // Carregar dados da companhia e cursos
    useEffect(() => {
        async function loadCompanyData() {
            if (!companyParam) return;
            
            setIsLoadingData(true);
            try {
                const response = await fetch(`/api/courses?company=${encodeURIComponent(companyParam)}`);
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Erro ao carregar dados da companhia');
                    return;
                }

                setCompanyData(data);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                setError('Erro ao carregar dados da companhia');
            } finally {
                setIsLoadingData(false);
            }
        }

        loadCompanyData();
    }, [companyParam]);

    async function sendCourseData() {
        setError('');
        setIsLoading(true);
        
        try {
            if (!selectedCourseId || !courseStudent || !courseDate || !courseTime) {
                setError('Todos os campos são obrigatórios.');
                return;
            }

            if (!email) {
                setError('Usuário não autenticado.');
                return;
            }

            if (!companyData) {
                setError('Dados da companhia não carregados.');
                return;
            }

            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    courseId: parseInt(selectedCourseId),
                    courseStudent,
                    courseDate,
                    courseTime,
                    instructorEmail: email,
                    companyId: companyData.company.id
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao aplicar curso');
                return;
            }

            // Reset form
            setSelectedCourseId('');
            setCourseStudent('');
            setCourseDate('');
            setCourseTime('');
            alert('Curso aplicado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            setError('Erro ao inserir dados do curso. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoadingData) {
        return (
            <>
                <Header />
                <main className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900 p-4 lg:p-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                            <span className="ml-2 text-gray-900 dark:text-white">Carregando...</span>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (!companyData) {
        return (
            <>
                <Header />
                <main className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900 p-4 lg:p-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Erro
                            </h1>
                            <p className="text-red-600 dark:text-red-400">
                                {error || 'Companhia não encontrada'}
                            </p>
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
            <main className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900 p-4 lg:p-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        {companyData.company.nome}
                    </h1>
                    
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        {/* Course Selection */}
                        <div>
                            <label 
                                htmlFor="courseId" 
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Curso Aplicado:
                            </label>
                            <select 
                                id="courseId" 
                                name="courseId" 
                                onChange={(e) => setSelectedCourseId(e.target.value)} 
                                value={selectedCourseId}
                                disabled={isLoading}
                                className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">Selecione um curso</option>
                                {companyData.courses
                                    .sort((a, b) => a.id - b.id)
                                    .map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.sigla} - {course.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Student Input */}
                        <div>
                            <label 
                                htmlFor="courseStudent" 
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Aluno:
                            </label>
                            <input 
                                type="text" 
                                id="courseStudent" 
                                name="courseStudent" 
                                placeholder="Digite o nick do aluno" 
                                onChange={(e) => setCourseStudent(e.target.value)} 
                                value={courseStudent}
                                disabled={isLoading}
                                className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                        
                        {/* Date and Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Data e hora da aplicação:
                            </label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input 
                                    type="date"
                                    id="courseDate" 
                                    name="courseDate"
                                    onChange={(e) => setCourseDate(e.target.value)} 
                                    value={courseDate}
                                    disabled={isLoading}
                                    className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <input 
                                    type="time" 
                                    id="courseTime" 
                                    name="courseTime" 
                                    onChange={(e) => setCourseTime(e.target.value)} 
                                    value={courseTime}
                                    disabled={isLoading}
                                    className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        
                        {/* Submit Button */}
                        <div className="pt-2">
                            <button 
                                type="button" 
                                onClick={sendCourseData}
                                disabled={isLoading}
                                className="w-full h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border-none rounded-md cursor-pointer transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                        Enviando...
                                    </div>
                                ) : (
                                    'Postar'
                                )}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-3">
                                <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                                    {error}
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
}

export default CompanyCoursePages;
