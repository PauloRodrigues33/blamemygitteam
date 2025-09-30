import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/lib/git';
import { DatabaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const repositories = DatabaseService.getRepositories(); 
    
    if (!repositories || repositories.length === 0) {
      return NextResponse.json({ message: 'Nenhum repositório configurado para atualizar.' }, { status: 200 });
    }

    const results = [];
    for (const repo of repositories) {
      let status = 'skipped';
      let message = 'Repositório inválido ou não encontrado.';
      try {
        const gitService = new GitService(repo.path);
        if (await gitService.isValidRepository()) {
          await gitService.fetch(); // This has the try/catch for permissions
          status = 'success';
          message = 'Atualizado com sucesso.';
        }
      } catch (error) {
        status = 'error';
        message = error instanceof Error ? error.message : 'Erro desconhecido durante o fetch.';
      }
      results.push({ name: repo.name, status, message });
    }

    return NextResponse.json({ message: 'Busca por atualizações concluída.', results });

  } catch (error) {
    console.error('Erro na API de fetch:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar atualizações.' }, { status: 500 });
  }
}
