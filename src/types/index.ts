export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  repository: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface Repository {
  id: string;
  name: string;
  path: string;
  lastSync?: Date;
}

export interface Author {
  name: string;
  email: string;
  commits: GitCommit[];
  totalCommits: number;
  totalInsertions: number;
  totalDeletions: number;
  lastCommitDate: Date;
}

export interface DateFilter {
  type: 'today' | 'yesterday' | 'last3days' | 'lastweek' | 'lastmonth' | 'last2months' | 'last3months' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardStats {
  totalCommits: number;
  totalAuthors: number;
  totalRepositories: number;
  commitsToday: number;
}

export interface DatabaseStats {
  general: {
    total_commits: number;
    total_authors: number;
    total_repositories: number;
    total_files_changed: number;
    total_insertions: number;
    total_deletions: number;
  };
  topAuthors: Array<{
    author_name: string;
    author_email: string;
    commits_count: number;
    total_files: number;
    total_insertions: number;
    total_deletions: number;
  }>;
  commitsByDay: Array<{
    day: string;
    commits_count: number;
    authors_count: number;
  }>;
}