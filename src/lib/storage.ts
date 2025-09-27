import { Repository } from '@/types';

const REPOSITORIES_KEY = 'git-repositories';
const AUTH_KEY = 'git-auth';

export class StorageService {
  static async getRepositories(): Promise<Repository[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const response = await fetch('/api/repositories');
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback para localStorage se a API falhar
      const stored = localStorage.getItem(REPOSITORIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao buscar repositórios:', error);
      
      // Fallback para localStorage
      try {
        const stored = localStorage.getItem(REPOSITORIES_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  }

  static async saveRepositories(repositories: Repository[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Manter localStorage como backup
    try {
      localStorage.setItem(REPOSITORIES_KEY, JSON.stringify(repositories));
    } catch (error) {
      console.error('Erro ao salvar repositórios no localStorage:', error);
    }
  }

  static async addRepository(repository: Omit<Repository, 'id'>): Promise<Repository> {
    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repository),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar repositório');
      }

      const newRepo = await response.json();

      // Também salvar no localStorage como backup
      const repositories = await this.getRepositories();
      const exists = repositories.some(repo => repo.path === repository.path);
      if (!exists) {
        repositories.push(newRepo);
        await this.saveRepositories(repositories);
      }

      return newRepo;
    } catch (error) {
      console.error('Erro ao adicionar repositório:', error);
      
      // Fallback para localStorage
      const repositories = await this.getRepositories();
      const exists = repositories.some(repo => repo.path === repository.path);
      if (exists) {
        throw new Error('Repositório já existe');
      }
      
      const newRepo: Repository = {
        ...repository,
        id: Date.now().toString(),
      };
      
      repositories.push(newRepo);
      await this.saveRepositories(repositories);
      return newRepo;
    }
  }

  static async removeRepository(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/repositories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover repositório');
      }

      // Também remover do localStorage
      const repositories = await this.getRepositories();
      const filtered = repositories.filter(repo => repo.id !== id);
      await this.saveRepositories(filtered);
    } catch (error) {
      console.error('Erro ao remover repositório:', error);
      
      // Fallback para localStorage
      const repositories = await this.getRepositories();
      const filtered = repositories.filter(repo => repo.id !== id);
      await this.saveRepositories(filtered);
    }
  }

  static async updateRepository(id: string, updates: Partial<Repository>): Promise<void> {
    try {
      const repositories = await this.getRepositories();
      const repository = repositories.find(repo => repo.id === id);
      
      if (repository) {
        const updatedRepository = { ...repository, ...updates };
        
        const response = await fetch('/api/repositories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedRepository),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar repositório');
        }

        // Também atualizar no localStorage
        const index = repositories.findIndex(repo => repo.id === id);
        if (index !== -1) {
          repositories[index] = updatedRepository;
          await this.saveRepositories(repositories);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar repositório:', error);
      
      // Fallback para localStorage
      const repositories = await this.getRepositories();
      const index = repositories.findIndex(repo => repo.id === id);
      
      if (index !== -1) {
        repositories[index] = { ...repositories[index], ...updates };
        await this.saveRepositories(repositories);
      }
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const auth = localStorage.getItem(AUTH_KEY);
      return auth === 'true';
    } catch {
      return false;
    }
  }

  static setAuthenticated(value: boolean): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(AUTH_KEY, value.toString());
    } catch (error) {
      console.error('Erro ao salvar autenticação:', error);
    }
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}