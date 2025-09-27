import { useState, useCallback } from 'react';
import { GitCommit, Repository, DatabaseStats } from '@/types';

export function useDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro na operação');
      }
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncRepositories = useCallback(async (repositories: Repository[]) => {
    return apiCall('/api/database', {
      method: 'POST',
      body: JSON.stringify({
        action: 'sync_repositories',
        data: { repositories }
      })
    });
  }, [apiCall]);

  const getStats = useCallback(async (startDate: string, endDate: string): Promise<DatabaseStats> => {
    return apiCall('/api/database', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_stats',
        data: { startDate, endDate }
      })
    });
  }, [apiCall]);

  const getCommits = useCallback(async (filters: {
    startDate?: string;
    endDate?: string;
    authorEmail?: string;
    repositoryName?: string;
  } = {}): Promise<GitCommit[]> => {
    return apiCall('/api/database', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_commits',
        data: { filters }
      })
    });
  }, [apiCall]);

  const getAuthorStats = useCallback(async (startDate: string, endDate: string) => {
    return apiCall('/api/database', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_author_stats',
        data: { startDate, endDate }
      })
    });
  }, [apiCall]);

  const getRepositories = useCallback(async (): Promise<Repository[]> => {
    return apiCall('/api/database?action=repositories');
  }, [apiCall]);

  const removeRepository = useCallback(async (path: string) => {
    return apiCall('/api/database', {
      method: 'POST',
      body: JSON.stringify({
        action: 'remove_repository',
        data: { path }
      })
    });
  }, [apiCall]);

  return {
    loading,
    error,
    syncRepositories,
    getStats,
    getCommits,
    getAuthorStats,
    getRepositories,
    removeRepository,
  };
}