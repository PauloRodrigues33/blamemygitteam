import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/lib/git';
import { GitCommit } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { repositories, dateFilter } = await request.json();
    
    if (!repositories || !Array.isArray(repositories)) {
      return NextResponse.json(
        { error: 'Lista de repositórios é obrigatória' },
        { status: 400 }
      );
    }

    const allCommits: GitCommit[] = [];
    const errors: string[] = [];

    // Processar filtro de data
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateFilter) {
      const dateRange = GitService.getDateRange(
        dateFilter.type,
        dateFilter.startDate ? new Date(dateFilter.startDate) : undefined,
        dateFilter.endDate ? new Date(dateFilter.endDate) : undefined
      );
      startDate = dateRange.start;
      endDate = dateRange.end;
    }

    // Buscar commits de cada repositório
    for (const repo of repositories) {
      try {
        const gitService = new GitService(repo.path);
        
        // Verificar se é um repositório válido
        const isValid = await gitService.isValidRepository();
        if (!isValid) {
          errors.push(`Repositório inválido: ${repo.name} (${repo.path})`);
          continue;
        }

        const commits = await gitService.getCommits(startDate, endDate);
        
        // Adicionar nome do repositório aos commits
        const commitsWithRepo = commits.map(commit => ({
          ...commit,
          repository: repo.name,
        }));

        allCommits.push(...commitsWithRepo);
      } catch (error) {
        console.error(`Erro ao processar repositório ${repo.name}:`, error);
        errors.push(`Erro no repositório ${repo.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // Ordenar commits por data (mais recentes primeiro)
    allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      commits: allCommits,
      errors: errors.length > 0 ? errors : undefined,
      totalCommits: allCommits.length,
    });

  } catch (error) {
    console.error('Erro na API de commits:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}