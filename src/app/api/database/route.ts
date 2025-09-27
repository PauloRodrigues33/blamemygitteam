import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { GitService } from '@/lib/git';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'sync_repositories':
        // Sincronizar repositórios do localStorage para o banco
        const repositories = data.repositories || [];
        
        for (const repo of repositories) {
          DatabaseService.saveRepository(repo);
          
          // Buscar commits do repositório e salvar no banco
          try {
            const gitService = new GitService(repo.path);
            const commits = await gitService.getCommits();
            DatabaseService.saveCommits(commits, repo.name);
          } catch (error) {
            console.error(`Erro ao sincronizar repositório ${repo.name}:`, error);
          }
        }
        
        return NextResponse.json({ success: true, message: 'Repositórios sincronizados com sucesso' });

      case 'get_stats':
        const { startDate, endDate } = data;
        const stats = DatabaseService.getGeneralStats(startDate, endDate);
        const topAuthors = DatabaseService.getTopAuthors(startDate, endDate, 10);
        const commitsByDay = DatabaseService.getCommitsByDay(startDate, endDate);
        
        return NextResponse.json({
          success: true,
          data: {
            general: stats,
            topAuthors,
            commitsByDay
          }
        });

      case 'get_commits':
        const commits = DatabaseService.getCommits(data.filters || {});
        return NextResponse.json({ success: true, data: commits });

      case 'get_author_stats':
        const authorStats = DatabaseService.generateAuthorStats(data.startDate, data.endDate);
        return NextResponse.json({ success: true, data: authorStats });

      case 'get_repositories':
        const repos = DatabaseService.getRepositories();
        return NextResponse.json({ success: true, data: repos });

      case 'remove_repository':
        DatabaseService.removeRepository(data.path);
        return NextResponse.json({ success: true, message: 'Repositório removido com sucesso' });

      default:
        return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API do banco de dados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'repositories':
        const repos = DatabaseService.getRepositories();
        return NextResponse.json({ success: true, data: repos });

      case 'stats':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const stats = DatabaseService.getGeneralStats(startDate || undefined, endDate || undefined);
        return NextResponse.json({ success: true, data: stats });

      default:
        return NextResponse.json({ success: false, error: 'Ação não especificada' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API do banco de dados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}