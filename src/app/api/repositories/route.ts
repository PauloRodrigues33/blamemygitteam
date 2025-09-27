import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { Repository } from '@/types';

// GET - Buscar todos os repositórios
export async function GET() {
  try {
    const repositories = DatabaseService.getRepositories();
    return NextResponse.json(repositories);
  } catch (error) {
    console.error('Erro ao buscar repositórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar novo repositório
export async function POST(request: NextRequest) {
  try {
    const repositoryData = await request.json();
    
    // Validar dados obrigatórios
    if (!repositoryData.name || !repositoryData.path) {
      return NextResponse.json(
        { error: 'Nome e caminho são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar repositório com ID se não existir
    const repository: Repository = {
      id: repositoryData.id || Date.now().toString(),
      name: repositoryData.name,
      path: repositoryData.path
    };

    DatabaseService.saveRepository(repository);
    
    return NextResponse.json(repository, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar repositório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar repositório
export async function PUT(request: NextRequest) {
  try {
    const repository: Repository = await request.json();
    
    // Validar dados obrigatórios
    if (!repository.name || !repository.path) {
      return NextResponse.json(
        { error: 'Nome e caminho são obrigatórios' },
        { status: 400 }
      );
    }

    DatabaseService.saveRepository(repository);
    
    return NextResponse.json(
      { message: 'Repositório atualizado com sucesso' }
    );
  } catch (error) {
    console.error('Erro ao atualizar repositório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover repositório
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const id = searchParams.get('id');
    
    if (!path && !id) {
      return NextResponse.json(
        { error: 'Caminho ou ID do repositório é obrigatório' },
        { status: 400 }
      );
    }

    if (path) {
      DatabaseService.removeRepository(path);
    } else if (id) {
      DatabaseService.removeRepositoryById(id);
    }
    
    return NextResponse.json(
      { message: 'Repositório removido com sucesso' }
    );
  } catch (error) {
    console.error('Erro ao remover repositório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}