'use client';

import { useState } from 'react';
import { useAuth } from '../commons/AuthContext';
import Header from '../header/Header';
import Footer from '../footer/Footer';

function EfbPage() {
    const [courseName, setCourseName] = useState('');
    const [courseStudent, setCourseStudent] = useState('');
    const [courseDate, setCourseDate] = useState('');
    const [courseTime, setCourseTime] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useAuth();
    const email = user?.email;

    async function sendCourseData() {
        setError('');
        setIsLoading(true);
        
        try {
            if (!courseName || !courseStudent || !courseDate || !courseTime) {
                setError('Todos os campos são obrigatórios.');
                return;
            }

            if (!email) {
                setError('Usuário não autenticado.');
                return;
            }

            const response = await fetch('/api/efb', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    courseName,
                    courseStudent,
                    courseDate,
                    courseTime,
                    instructorEmail: email
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao aplicar curso');
                return;
            }

            // Reset form
            setCourseName('');
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

    return (
        <>
            <Header />
            <main className="min-h-[calc(100dvh-16dvh)] flex items-center justify-center bg-gradient-to-br from-yellow-300 to-green-600 dark:from-gray-800 dark:to-gray-900 p-4 lg:p-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        Escola de Formação Básica
                    </h1>
                    
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        {/* Course Selection */}
                        <div>
                            <label 
                                htmlFor="courseName" 
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Curso Aplicado:
                            </label>
                            <select 
                                id="courseName" 
                                name="courseName" 
                                onChange={(e) => setCourseName(e.target.value)} 
                                value={courseName}
                                disabled={isLoading}
                                className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">Selecione um curso</option>
                                <option value="CPO">CPO - Capacitação para Oficialato</option>
                                <option value="CPS">CPS - Capacitação de Promoção para Subtenente</option>
                                <option value="CFL">CFL - Capacitação de Funções de Liderança</option>
                                <option value="CFB">CFB - Capacitação de Funções do Batalhão</option>
                                <option value="CbFS">CbFS - Capacitação Básica do Fórum e Segurança</option>
                                <option value="CAC">CAC - Capacitação Avançada de Comandos</option>
                                <option value="CFS">CFS - Capacitação de Formação de Soldados</option>
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

export default EfbPage;
