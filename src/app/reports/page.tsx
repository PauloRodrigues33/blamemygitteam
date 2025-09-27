'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import Navigation from '@/components/Navigation';
import { Users, GitCommit, TrendingUp, FileText } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DatabaseStats } from '@/types';

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const { getStats, syncRepositories, loading, error } = useDatabase();
  
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const loadReports = useCallback(async () => {
    try {
      // Sincronizar dados primeiro
      const repositories = JSON.parse(localStorage.getItem('repositories') || '[]');
      if (repositories.length > 0) {
        await syncRepositories(repositories);
      }

      // Carregar estatísticas
      const statsData = await getStats(dateRange.start, dateRange.end);
      setStats(statsData);


    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  }, [dateRange.start, dateRange.end, syncRepositories, getStats]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
    }
  }, [isAuthenticated, dateRange, loadReports]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    
    switch (period) {
      case 'today':
        setDateRange({
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        });
        break;
      case '7days':
        setDateRange({
          start: format(subDays(today, 7), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        });
        break;
      case '30days':
        setDateRange({
          start: format(subDays(today, 30), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        });
        break;
      case 'thisweek':
        setDateRange({
          start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        });
        break;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="flex-1 p-8">
        <div className="mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios Avançados</h1>
            <p className="text-gray-600">Análise detalhada da produtividade da equipe</p>
          </div>

          {/* Filtros de Período */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Período de Análise</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              {[
                { key: 'today', label: 'Hoje' },
                { key: '7days', label: 'Últimos 7 dias' },
                { key: '30days', label: 'Últimos 30 dias' },
                { key: 'thisweek', label: 'Esta semana' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPeriod === period.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando relatórios...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {stats && (
            <>
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GitCommit className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Commits</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.general?.total_commits || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Desenvolvedores Ativos</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.general?.total_authors || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Linhas Adicionadas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.general?.total_insertions || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Arquivos Modificados</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.general?.total_files_changed || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Desenvolvedores */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Desenvolvedores</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Desenvolvedor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Arquivos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Linhas +
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Linhas -
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.topAuthors?.map((author, index: number) => (
                        <tr key={`${author.author_email}-${author.author_name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{author.author_name}</div>
                              <div className="text-sm text-gray-500">{author.author_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {author.commits_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {author.total_files}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +{author.total_insertions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -{author.total_deletions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Atividade por Dia */}
              {stats.commitsByDay && stats.commitsByDay.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Atividade por Dia</h2>
                  <div className="space-y-4">
                    {stats.commitsByDay.map((day) => (
                      <div key={day.day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(new Date(day.day), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {day.authors_count} desenvolvedor(es) ativo(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{day.commits_count}</p>
                          <p className="text-sm text-gray-600">commits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}