import Database from 'better-sqlite3';
import path from 'path';
import { GitCommit, Repository } from '@/types';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'git-monitor.db');

// Garantir que o diretório existe
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Criar tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS commits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    date TEXT NOT NULL,
    message TEXT NOT NULL,
    repository_path TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    files_changed INTEGER DEFAULT 0,
    insertions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    last_sync DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS author_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    date TEXT NOT NULL,
    commits_count INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,
    insertions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(author_email, repository_name, date)
  );

  CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(date);
  CREATE INDEX IF NOT EXISTS idx_commits_author ON commits(author_email);
  CREATE INDEX IF NOT EXISTS idx_commits_repository ON commits(repository_name);
  CREATE INDEX IF NOT EXISTS idx_author_stats_date ON author_stats(date);
`);

export class DatabaseService {
  // Salvar commits no banco
  static saveCommits(commits: GitCommit[], repositoryName: string) {
    const insertCommit = db.prepare(`
      INSERT OR REPLACE INTO commits 
      (hash, author_name, author_email, date, message, repository_path, repository_name, files_changed, insertions, deletions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((commits: GitCommit[]) => {
      for (const commit of commits) {
        insertCommit.run(
          commit.hash,
          commit.author,
          commit.email,
          commit.date.toISOString(),
          commit.message,
          commit.repository,
          repositoryName,
          commit.filesChanged || 0,
          commit.insertions || 0,
          commit.deletions || 0
        );
      }
    });

    insertMany(commits);
  }

  // Buscar commits por filtros
  static getCommits(filters: {
    startDate?: string;
    endDate?: string;
    authorEmail?: string;
    repositoryName?: string;
  } = {}): GitCommit[] {
    let query = 'SELECT * FROM commits WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.startDate) {
      query += ' AND date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND date <= ?';
      params.push(filters.endDate);
    }

    if (filters.authorEmail) {
      query += ' AND author_email = ?';
      params.push(filters.authorEmail);
    }

    if (filters.repositoryName) {
      query += ' AND repository_name = ?';
      params.push(filters.repositoryName);
    }

    query += ' ORDER BY date DESC';

    const stmt = db.prepare(query);
    
    interface DbCommit {
      hash: string;
      author_name: string;
      author_email: string;
      date: string;
      message: string;
      repository_path: string;
      files_changed: number;
      insertions: number;
      deletions: number;
    }
    
    const rows = stmt.all(...params) as DbCommit[];

    return rows.map((row: DbCommit) => ({
      hash: row.hash,
      author: row.author_name,
      email: row.author_email,
      date: new Date(row.date),
      message: row.message,
      repository: row.repository_path,
      filesChanged: row.files_changed || 0,
      insertions: row.insertions || 0,
      deletions: row.deletions || 0
    }));
  }

  // Salvar repositório
  static saveRepository(repository: Repository) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO repositories (name, path, last_sync)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(repository.name, repository.path, new Date().toISOString());
  }

  // Buscar repositórios
  static getRepositories(): Repository[] {
    const stmt = db.prepare('SELECT * FROM repositories ORDER BY name');
    
    interface DbRepository {
      id: number;
      name: string;
      path: string;
    }
    
    const rows = stmt.all() as DbRepository[];
    
    return rows.map((row: DbRepository) => ({
      id: row.id.toString(),
      name: row.name,
      path: row.path
    }));
  }

  // Remover repositório por path
  static removeRepository(path: string) {
    const stmt = db.prepare('DELETE FROM repositories WHERE path = ?');
    stmt.run(path);
    
    // Também remover commits relacionados
    const deleteCommits = db.prepare('DELETE FROM commits WHERE repository_path = ?');
    deleteCommits.run(path);
  }

  // Remover repositório por ID
  static removeRepositoryById(id: string) {
    // Primeiro buscar o path do repositório
    const getPath = db.prepare('SELECT path FROM repositories WHERE id = ?');
    const result = getPath.get(id) as { path: string } | undefined;
    
    if (result) {
      // Remover repositório
      const stmt = db.prepare('DELETE FROM repositories WHERE id = ?');
      stmt.run(id);
      
      // Também remover commits relacionados
      const deleteCommits = db.prepare('DELETE FROM commits WHERE repository_path = ?');
      deleteCommits.run(result.path);
    }
  }

  // Gerar estatísticas por autor
  static generateAuthorStats(startDate: string, endDate: string) {
    const stmt = db.prepare(`
      SELECT 
        author_name,
        author_email,
        repository_name,
        COUNT(*) as commits_count,
        SUM(files_changed) as total_files,
        SUM(insertions) as total_insertions,
        SUM(deletions) as total_deletions
      FROM commits 
      WHERE date >= ? AND date <= ?
      GROUP BY author_email, repository_name
      ORDER BY commits_count DESC
    `);

    return stmt.all(startDate, endDate);
  }

  // Estatísticas gerais
  static getGeneralStats(startDate?: string, endDate?: string) {
    let query = `
      SELECT 
        COUNT(*) as total_commits,
        COUNT(DISTINCT author_email) as total_authors,
        COUNT(DISTINCT repository_name) as total_repositories,
        SUM(files_changed) as total_files_changed,
        SUM(insertions) as total_insertions,
        SUM(deletions) as total_deletions
      FROM commits
    `;

    const params: string[] = [];

    if (startDate && endDate) {
      query += ' WHERE date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  // Commits por dia (para gráficos)
  static getCommitsByDay(startDate: string, endDate: string) {
    const stmt = db.prepare(`
      SELECT 
        DATE(date) as day,
        COUNT(*) as commits_count,
        COUNT(DISTINCT author_email) as authors_count
      FROM commits 
      WHERE date >= ? AND date <= ?
      GROUP BY DATE(date)
      ORDER BY day
    `);

    return stmt.all(startDate, endDate);
  }

  // Top autores por período
  static getTopAuthors(startDate: string, endDate: string, limit: number = 10) {
    const stmt = db.prepare(`
      SELECT 
        author_name,
        author_email,
        COUNT(*) as commits_count,
        SUM(files_changed) as total_files,
        SUM(insertions) as total_insertions,
        SUM(deletions) as total_deletions
      FROM commits 
      WHERE date >= ? AND date <= ?
      GROUP BY author_email
      ORDER BY commits_count DESC
      LIMIT ?
    `);

    return stmt.all(startDate, endDate, limit);
  }

  // Sincronizar dados do localStorage para o banco
  static syncFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const repositories = JSON.parse(localStorage.getItem('repositories') || '[]');
      
      for (const repo of repositories) {
        this.saveRepository(repo);
      }
    }
  }
}

export default db;