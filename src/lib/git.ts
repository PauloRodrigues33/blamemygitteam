import { simpleGit, SimpleGit } from 'simple-git';
import { GitCommit } from '@/types';
import { format, startOfDay, endOfDay, subDays, startOfWeek, subMonths } from 'date-fns';

export class GitService {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async getCommits(since?: Date, until?: Date): Promise<GitCommit[]> {
    try {
      // Construir argumentos do comando git log manualmente
      const args: string[] = ['log', '--max-count=1000', '--pretty=format:%H|%ai|%s|%an|%ae'];

      if (since) {
        args.push(`--since=${format(since, 'yyyy-MM-dd')}`);
      }
      if (until) {
        args.push(`--until=${format(until, 'yyyy-MM-dd')}`);
      }

      // Usar raw para evitar problemas com parsing de argumentos
      const logOutput = await this.git.raw(args);
      
      const commits: GitCommit[] = [];
      
      // Processar a saída do comando git log
      const lines = logOutput.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 5) {
          const [hash, date, message, authorName, authorEmail] = parts;
          
          // Obter estatísticas do commit
          try {
            const stats = await this.git.show(['--stat', '--format=', hash]);
            const statsLines = stats.split('\n').filter(line => line.trim());
            
            let filesChanged = 0;
            let insertions = 0;
            let deletions = 0;
            
            // Parsear estatísticas
            const lastLine = statsLines[statsLines.length - 1];
            if (lastLine && lastLine.includes('changed')) {
              const match = lastLine.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
              if (match) {
                filesChanged = parseInt(match[1]) || 0;
                insertions = parseInt(match[2]) || 0;
                deletions = parseInt(match[3]) || 0;
              }
            }

            commits.push({
              hash: hash.trim(),
              author: authorName.trim(),
              email: authorEmail.trim(),
              date: new Date(date.trim()),
              message: message.trim(),
              repository: '', // Será preenchido pelo chamador
              filesChanged,
              insertions,
              deletions,
            });
          } catch (error) {
            console.warn(`Erro ao obter estatísticas do commit ${hash}:`, error);
            // Adicionar commit mesmo sem estatísticas
            commits.push({
              hash: hash.trim(),
              author: authorName.trim(),
              email: authorEmail.trim(),
              date: new Date(date.trim()),
              message: message.trim(),
              repository: '', // Será preenchido pelo chamador
              filesChanged: 0,
              insertions: 0,
              deletions: 0,
            });
          }
        }
      }

      return commits;
    } catch (error) {
      console.error('Erro ao obter commits:', error);
      return [];
    }
  }

  async isValidRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  static getDateRange(filterType: string, customStart?: Date, customEnd?: Date) {
    const now = new Date();
    
    switch (filterType) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday),
        };
      case 'last3days':
        return {
          start: startOfDay(subDays(now, 2)),
          end: endOfDay(now),
        };
      case 'lastweek':
        return {
          start: startOfWeek(now),
          end: endOfDay(now),
        };
      case 'lastmonth':
        return {
          start: startOfDay(subMonths(now, 1)),
          end: endOfDay(now),
        };
      case 'last2months':
        return {
          start: startOfDay(subMonths(now, 2)),
          end: endOfDay(now),
        };
      case 'last3months':
        return {
          start: startOfDay(subMonths(now, 3)),
          end: endOfDay(now),
        };
      case 'custom':
        return {
          start: customStart || startOfDay(now),
          end: customEnd || endOfDay(now),
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
    }
  }
}