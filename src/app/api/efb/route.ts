import { NextRequest, NextResponse } from 'next/server';
import supabase from '../supabase';

interface EFBRequestBody {
  courseName: string;
  courseStudent: string;
  courseDate: string;
  courseTime: string;
  instructorEmail: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EFBRequestBody = await request.json();
    const { courseName, courseStudent, courseDate, courseTime, instructorEmail } = body;

    if (typeof courseName !== 'string' || !courseName.trim() ||
        typeof courseStudent !== 'string' || !courseStudent.trim() ||
        typeof courseDate !== 'string' || !courseDate.trim() ||
        typeof courseTime !== 'string' || !courseTime.trim() ||
        typeof instructorEmail !== 'string' || !instructorEmail.trim()) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: instructorData, error: instructorError } = await supabase
      .from('militares')
      .select('id')
      .eq('email', instructorEmail)
      .single();

    if (instructorError || !instructorData) {
      console.error('Erro ao buscar instrutor:', instructorError);
      return NextResponse.json(
        { error: 'Instrutor não encontrado' },
        { status: 404 }
      );
    }

    const instructorId = instructorData.id;

    if (courseName === 'CFS') {
      const { data: existingStudent, error: checkError } = await supabase
        .from('militares')
        .select('id')
        .eq('nick', courseStudent)
        .single();

      if (!checkError && existingStudent) {
        const { data: existingCourse, error: courseCheckError } = await supabase
          .from('cursos')
          .select('id')
          .eq('curso', courseName)
          .eq('militar', existingStudent.id)
          .single();

        if (!courseCheckError && existingCourse) {
          return NextResponse.json(
            { error: 'O militar já possui este curso aplicado' },
            { status: 400 }
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from('militares')
          .insert([
            {
              nick: courseStudent,
              email: '',
              patente: 'Soldado',
              status: 'aguardando',
              ativo: true
            }
          ]);

        if (insertError) {
          console.error('Erro ao criar militar:', insertError);
          return NextResponse.json(
            { error: 'Erro ao criar militar' },
            { status: 500 }
          );
        }
      }
    }

    // Buscar dados do aluno
    const { data: studentData, error: studentError } = await supabase
      .from('militares')
      .select('id')
      .eq('nick', courseStudent)
      .single();

    if (studentError || !studentData) {
      console.error('Erro ao buscar militar:', studentError);
      return NextResponse.json(
        { error: 'Militar não foi encontrado. Verifique o nome do militar.' },
        { status: 404 }
      );
    }

    const studentId = studentData.id;

    const { data: existingCourse, error: courseCheckError } = await supabase
      .from('cursos')
      .select('id')
      .eq('curso', courseName)
      .eq('militar', studentId)
      .single();

    if (!courseCheckError && existingCourse) {
      return NextResponse.json(
        { error: 'O aluno já possui este curso aplicado' },
        { status: 400 }
      );
    }

    const { error: insertCourseError } = await supabase
      .from('cursos')
      .insert([
        {
          curso: courseName,
          aplicador: instructorId,
          militar: studentId,
          dataAplicação: courseDate,
          horaAplicação: courseTime
        }
      ]);

    if (insertCourseError) {
      console.error('Erro ao inserir curso:', insertCourseError);
      return NextResponse.json(
        { error: 'Erro ao inserir dados do curso' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Curso aplicado com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}