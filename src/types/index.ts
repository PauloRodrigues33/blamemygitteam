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
  branch?: string;
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

export interface BranchActivity {
  branch: string;
  repository: string;
  author: string;
  email: string;
  lastCommit: Date;
  lastCommitMessage: string;
  totalCommits: number;
  isActive: boolean;
}

export interface DeveloperActivity {
  author: string;
  email: string;
  lastActivity: Date;
  lastCommitMessage: string;
  lastRepository: string;
  lastBranch: string;
  totalCommitsToday: number;
  totalCommitsWeek: number;
  activeBranches: string[];
  repositories: string[];
}

export interface BranchStats {
  branch: string;
  repository: string;
  totalCommits: number;
  totalAuthors: number;
  lastActivity: Date;
  authors: Array<{
    name: string;
    email: string;
    commits: number;
    lastCommit: Date;
  }>;
}