import { NextRequest, NextResponse } from 'next/server';
import supabase from '../supabase';

interface EFBRequestBody {
  courseName: string;
  courseStudent: string;
  courseDate: string;
  courseTime: string;
  instructorEmail: string;
}

interface CompanyCourseRequestBody {
  courseId: number;
  courseStudent: string;
  courseDate: string;
  courseTime: string;
  instructorEmail: string;
  companyId: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyParam = searchParams.get('company');

    if (!companyParam) {
      return NextResponse.json(
        { error: 'Parâmetro company é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar companhia por sigla ou ID
    let companyQuery = supabase
      .from('companhias')
      .select('id, sigla, nome');

    // Verificar se é um número (ID) ou string (sigla)
    if (!isNaN(Number(companyParam))) {
      companyQuery = companyQuery.eq('id', Number(companyParam));
    } else {
      companyQuery = companyQuery.eq('sigla', companyParam.toUpperCase());
    }

    const { data: companyData, error: companyError } = await companyQuery.single();

    if (companyError || !companyData) {
      return NextResponse.json(
        { error: 'Companhia não encontrada' },
        { status: 404 }
      );
    }

    // Buscar cursos da companhia
    const { data: coursesData, error: coursesError } = await supabase
      .from('cursos-companhias')
      .select('id, sigla, nome, obrigatorio, patente')
      .eq('companhia', companyData.id)
      .order('id');

    if (coursesError) {
      console.error('Erro ao buscar cursos:', coursesError);
      return NextResponse.json(
        { error: 'Erro ao buscar cursos da companhia' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      company: companyData,
      courses: coursesData || []
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se é uma requisição do tipo novo (company-courses) ou antigo (efb)
    if ('courseId' in body && 'companyId' in body) {
      // Nova API - Cursos por companhia
      return await handleCompanyCourse(body as CompanyCourseRequestBody);
    } else {
      // API antiga - EFB
      return await handleEFBCourse(body as EFBRequestBody);
    }
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handleCompanyCourse(body: CompanyCourseRequestBody) {
  const { courseId, courseStudent, courseDate, courseTime, instructorEmail, companyId } = body;

  // Validações
  if (!courseId || !courseStudent?.trim() || !courseDate?.trim() || 
      !courseTime?.trim() || !instructorEmail?.trim() || !companyId) {
    return NextResponse.json(
      { error: 'Todos os campos são obrigatórios' },
      { status: 400 }
    );
  }

  // Buscar instrutor
  const { data: instructorData, error: instructorError } = await supabase
    .from('militares')
    .select('id, tag')
    .eq('email', instructorEmail)
    .single();

  if (instructorError || !instructorData) {
    console.error('Erro ao buscar instrutor:', instructorError);
    return NextResponse.json(
      { error: 'Instrutor não encontrado' },
      { status: 404 }
    );
  }

  // Buscar dados do curso
  const { data: courseData, error: courseError } = await supabase
    .from('cursos-companhias')
    .select('id, sigla, nome, companhia')
    .eq('id', courseId)
    .eq('companhia', companyId)
    .single();

  if (courseError || !courseData) {
    console.error('Erro ao buscar curso:', courseError);
    return NextResponse.json(
      { error: 'Curso não encontrado para esta companhia' },
      { status: 404 }
    );
  }

  // Verificar se é CFI para criar novo militar se necessário
  if (courseData.sigla === 'CFI') {
    const { data: existingStudent, error: checkError } = await supabase
      .from('militares')
      .select('id')
      .eq('nick', courseStudent)
      .single();

    if (!checkError && existingStudent) {
      // Verificar se já tem o curso
      const { data: existingCourse, error: courseCheckError } = await supabase
        .from('cursos')
        .select('id')
        .eq('curso', courseId)
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
            patente: 1,
            pago: false,
            status: 'aguardando',
            ativo: true,
            'tag-promotor': instructorData.tag
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

  // Verificar se já possui o curso
  const { data: existingCourse, error: courseCheckError } = await supabase
    .from('cursos')
    .select('id')
    .eq('curso', courseId)
    .eq('militar', studentData.id)
    .single();

  if (!courseCheckError && existingCourse) {
    return NextResponse.json(
      { error: 'O aluno já possui este curso aplicado' },
      { status: 400 }
    );
  }

  // Inserir curso
  const { error: insertCourseError } = await supabase
    .from('cursos')
    .insert([
      {
        curso: courseId,
        aplicador: instructorData.id,
        militar: studentData.id,
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
}

async function handleEFBCourse(body: EFBRequestBody) {
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

  // Buscar instrutor
  const { data: instructorData, error: instructorError } = await supabase
    .from('militares')
    .select('id, tag')
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

  if (courseName === 'CFI') {
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
            ativo: true,
            'tag-promotor': instructorData.tag
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
      { error: 'O militar já possui este curso aplicado' },
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
}