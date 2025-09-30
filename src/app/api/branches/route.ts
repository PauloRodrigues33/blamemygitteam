import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { GitService } from '@/lib/git';
import { RemoteBranch } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const repositories = DatabaseService.getRepositories();
    let allBranches: RemoteBranch[] = [];

    for (const repo of repositories) {
      try {
        const gitService = new GitService(repo.path);
        const branches = await gitService.getRemoteBranches();
        const branchesWithRepo = branches.map(branch => ({
          ...branch,
          repository: repo.name,
        }));
        allBranches = allBranches.concat(branchesWithRepo);
      } catch (error) {
        console.error(`Erro ao processar o repositório ${repo.path}:`, error);
        continue;
      }
    }

    const branchesByAuthor = allBranches.reduce((acc, branch) => {
      const author = branch.authorName || 'Unknown';
      if (!acc[author]) {
        acc[author] = [];
      }
      acc[author].push(branch);
      return acc;
    }, {} as Record<string, RemoteBranch[]>);

    const groupedBranches: Record<string, Record<string, RemoteBranch[]>> = {};

    for (const author in branchesByAuthor) {
      const authorBranches = branchesByAuthor[author];
      
      const branchesByRepo = authorBranches.reduce((acc, branch) => {
        const repoName = branch.repository;
        if (!acc[repoName]) {
          acc[repoName] = [];
        }
        acc[repoName].push(branch);
        return acc;
      }, {} as Record<string, RemoteBranch[]>);

      for (const repoName in branchesByRepo) {
        branchesByRepo[repoName].sort((a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime());
      }

      groupedBranches[author] = branchesByRepo;
    }

    return NextResponse.json({
      groupedBranches,
    });
  } catch (error) {
    console.error('Erro ao buscar dados de branches:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}