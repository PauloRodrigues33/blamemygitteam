import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/lib/git';
import { GitCommit, Repository, Author, DashboardStats } from '@/types';
import { DatabaseService } from '@/lib/database';
import { format, startOfDay, subDays, getHours, isToday } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repositoryName = searchParams.get('repo');
  const branchName = searchParams.get('branch');

  if (!repositoryName || !branchName) {
    return NextResponse.json({ error: 'O nome do repositório e da branch são obrigatórios' }, { status: 400 });
  }

  try {
    const repositories = DatabaseService.getRepositories();
    const repo = repositories.find(r => r.name === repositoryName);

    if (!repo) {
      return NextResponse.json({ error: 'Repositório não encontrado' }, { status: 404 });
    }

    const gitService = new GitService(repo.path);
    const remoteBranchName = `origin/${branchName}`;
    const commits = await gitService.getCommitsForBranch(remoteBranchName, 10);

    return NextResponse.json({ commits });
  } catch (error) {
    console.error('Erro ao buscar commits:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const { repositories, dateFilter } = await request.json();
    
    if (!repositories || !Array.isArray(repositories)) {
      return NextResponse.json({ error: 'Lista de repositórios é obrigatória' }, { status: 400 });
    }

    // 1. Get ALL commits first (no date filter)
    let allTimeCommits: GitCommit[] = [];
    const errors: string[] = [];

    for (const repo of repositories) {
      try {
        const gitService = new GitService(repo.path);
        if (!await gitService.isValidRepository()) {
          errors.push(`Repositório inválido: ${repo.name} (${repo.path})`);
          continue;
        }
        // Note: We don't call fetch here anymore, it's manual from the UI
        const commits = await gitService.getCommits(); // NO DATES = ALL COMMITS (up to the tool limit)
        allTimeCommits.push(...commits.map(c => ({ ...c, repository: repo.name })));
      } catch (error) {
        errors.push(`Erro no repositório ${repo.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    allTimeCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. Create the global author list for "Team Status"
    const allTimeAuthorsMap = new Map<string, { name: string, email: string, lastCommitDate: Date }>();
    allTimeCommits.forEach(commit => {
      const key = commit.email;
      if (!allTimeAuthorsMap.has(key)) {
        allTimeAuthorsMap.set(key, {
          name: commit.author,
          email: commit.email,
          lastCommitDate: new Date(commit.date),
        });
      }
    });
    const teamStatusAuthors = Array.from(allTimeAuthorsMap.values());

    // 3. Now, filter commits in memory for the rest of the dashboard
    let filteredCommits = allTimeCommits;
    if (dateFilter) {
      const range = GitService.getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const startDate = range.start;
      const endDate = range.end;
      if (startDate && endDate) {
          filteredCommits = allTimeCommits.filter(c => {
              const commitDate = new Date(c.date);
              return commitDate >= startDate && commitDate <= endDate;
          });
      }
    }

    // 4. All subsequent calculations use `filteredCommits`
    const authorsMap = new Map<string, Author>();
    filteredCommits.forEach(commit => {
      const key = commit.email;
      if (!authorsMap.has(key)) {
        authorsMap.set(key, {
          name: commit.author,
          email: commit.email,
          commits: [],
          totalCommits: 0,
          totalInsertions: 0,
          totalDeletions: 0,
          lastCommitDate: commit.date,
        });
      }
      const author = authorsMap.get(key)!;
      author.commits.push(commit);
      author.totalCommits++;
      author.totalInsertions += commit.insertions;
      author.totalDeletions += commit.deletions;
      if (new Date(commit.date) > new Date(author.lastCommitDate)) {
        author.lastCommitDate = commit.date;
      }
    });
    const authorsArray = Array.from(authorsMap.values()).sort((a, b) => b.totalCommits - a.totalCommits);

    const commitsToday = filteredCommits.filter(c => isToday(new Date(c.date))).length;

    const stats: DashboardStats = {
      totalCommits: filteredCommits.length,
      totalAuthors: authorsArray.length,
      totalRepositories: repositories.length,
      commitsToday,
    };

    const daysWithCommits = new Set(filteredCommits.map(c => format(new Date(c.date), 'yyyy-MM-dd'))).size;
    const avgCommitsPerDay = daysWithCommits > 0 ? filteredCommits.length / daysWithCommits : 0;
    const totalLines = filteredCommits.reduce((sum, c) => sum + c.insertions + c.deletions, 0);
    const avgLinesPerCommit = filteredCommits.length > 0 ? totalLines / filteredCommits.length : 0;
    const hourCounts = filteredCommits.reduce((acc, commit) => {
      const hour = getHours(new Date(commit.date));
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const mostActiveHour = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    const totalInsertions = filteredCommits.reduce((sum, c) => sum + c.insertions, 0);
    const totalDeletions = filteredCommits.reduce((sum, c) => sum + c.deletions, 0);
    const codeChurn = totalInsertions > 0 ? (totalDeletions / totalInsertions) * 100 : 0;
    const activeAuthors = new Set(filteredCommits.map(c => c.email)).size;
    const commitFrequency = activeAuthors > 0 ? filteredCommits.length / activeAuthors : 0;
    const repoCounts = filteredCommits.reduce((acc, commit) => {
      acc[commit.repository] = (acc[commit.repository] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topRepository = Object.entries(repoCounts).sort(([,a], [,b]) => b - a)[0]?.[0]?.split('/').pop() || 'N/A';
    
    // This metric doesn't make sense with filtered commits, it should use all commits
    const lastWeekDate = subDays(new Date(), 7);
    const recentCommitsCount = allTimeCommits.filter(c => new Date(c.date) >= lastWeekDate).length;
    const previousWeekCommitsCount = allTimeCommits.filter(c => {
      const date = new Date(c.date);
      return date >= subDays(lastWeekDate, 7) && date < lastWeekDate;
    }).length;
    const weeklyTrend = previousWeekCommitsCount > 0 
      ? ((recentCommitsCount - previousWeekCommitsCount) / previousWeekCommitsCount) * 100 
      : recentCommitsCount > 0 ? 100 : 0;

    const advancedMetrics = {
      avgCommitsPerDay: Math.round(avgCommitsPerDay * 10) / 10,
      avgLinesPerCommit: Math.round(avgLinesPerCommit),
      mostActiveHour: mostActiveHour !== 'N/A' ? `${mostActiveHour}h` : 'N/A',
      productivityScore: Math.min(100, Math.round((avgCommitsPerDay * 10) + (avgLinesPerCommit / 10) + (filteredCommits.length / 10))),
      codeChurn: Math.round(codeChurn),
      commitFrequency: Math.round(commitFrequency * 10) / 10,
      topRepository,
      weeklyTrend: Math.round(weeklyTrend),
      timelineData: Object.values(filteredCommits.reduce((acc, commit) => {
        const date = format(new Date(commit.date), 'dd/MM');
        if (!acc[date]) acc[date] = { date, commits: 0, authors: new Set() };
        acc[date].commits++;
        acc[date].authors.add(commit.email);
        return acc;
      }, {} as Record<string, { date: string; commits: number; authors: Set<string> }>)).map(d => ({...d, authors: d.authors.size})).slice(-14),
      authorActivityData: authorsArray.slice(0, 10).map(a => ({ name: a.name.split(' ')[0], email: a.email, commits: a.totalCommits, insertions: a.totalInsertions, deletions: a.totalDeletions })),
      productivityData: [
        { name: 'Alto', value: authorsArray.filter(a => a.totalCommits >= 10).length, color: '#10B981' },
        { name: 'Médio', value: authorsArray.filter(a => a.totalCommits >= 5 && a.totalCommits < 10).length, color: '#F59E0B' },
        { name: 'Baixo', value: authorsArray.filter(a => a.totalCommits < 5).length, color: '#EF4444' }
      ],
      hourlyData: Array.from({ length: 24 }, (_, hour) => ({ hour: hour.toString().padStart(2, '0'), commits: hourCounts[hour] || 0 }))
    };

    return NextResponse.json({
      stats,
      authors: authorsArray,
      teamStatusAuthors, // Add the new global list
      advancedMetrics,
      recentCommits: filteredCommits.slice(0, 10),
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Erro na API de commits:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}