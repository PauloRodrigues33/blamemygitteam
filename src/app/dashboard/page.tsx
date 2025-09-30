'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Users, GitCommit, TrendingUp, Filter, RefreshCw, AlertCircle,
  Clock, Code, Activity, Target, DownloadCloud, CheckCircle
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import { CommitTimeline, AuthorActivity, ProductivityDistribution, HourlyActivity } from '@/components/Charts';
import { useAuth } from '@/hooks/useAuth';
import { StorageService } from '@/lib/storage';
import { Repository, Author, GitCommit as GitCommitType } from '@/types';
import { format, startOfDay, differenceInDays, isToday } from 'date-fns';

const initialDashboardData = {
  stats: { totalCommits: 0, totalAuthors: 0, totalRepositories: 0, commitsToday: 0 },
  authors: [],
  teamStatusAuthors: [], // Add new initial state
  advancedMetrics: {
    avgCommitsPerDay: 0, avgLinesPerCommit: 0, mostActiveHour: 'N/A', productivityScore: 0,
    codeChurn: 0, commitFrequency: 0, topRepository: 'N/A', weeklyTrend: 0,
    timelineData: [], authorActivityData: [], productivityData: [], hourlyData: []
  },
  recentCommits: [],
};

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(initialDashboardData);
  
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRepositories();
      loadDateFilterPreference();
    }
  }, [isAuthenticated]);

  const loadRepositories = async () => {
    const repos = await StorageService.getRepositories();
    setRepositories(repos);
  };

  const loadDateFilterPreference = () => {
    const preference = StorageService.getDateFilterPreference();
    setDateFilter(preference.dateFilter);
    setCustomStartDate(preference.customStartDate || '');
    setCustomEndDate(preference.customEndDate || '');
  };

  const handleDateFilterChange = (newFilter: string) => {
    setDateFilter(newFilter);
    StorageService.setDateFilterPreference(newFilter, customStartDate, customEndDate);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    StorageService.setDateFilterPreference(dateFilter, start, end);
  };

  const loadDashboardData = useCallback(async () => {
    if (repositories.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    setNotifications([]); // Clear notifications on refresh
    setDashboardData(initialDashboardData);

    try {
      const filterData: { type: string; startDate?: string; endDate?: string } = { type: dateFilter };
      if (dateFilter === 'custom') {
        if (!customStartDate || !customEndDate) {
          setErrors(['Selecione as datas de início e fim para o filtro personalizado']);
          setIsLoading(false);
          return;
        }
        filterData.startDate = customStartDate;
        filterData.endDate = customEndDate;
      }

      const response = await fetch('/api/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositories, dateFilter: filterData }),
      });

      const data = await response.json();

      if (response.ok) {
        setDashboardData(data);
        if (data.errors) setErrors(data.errors);
      } else {
        setErrors([data.error || 'Erro ao carregar dados do dashboard']);
      }
    } catch (error) {
      setErrors(['Erro ao conectar com o servidor']);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, dateFilter, customStartDate, customEndDate]);

  const handleFetchRepositories = async () => {
    setIsFetching(true);
    setNotifications([]);
    setErrors([]);
    try {
      const response = await fetch('/api/repositories/fetch', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications([data.message || 'Repositórios atualizados.']);
        // After fetching, automatically refresh the dashboard data
        await loadDashboardData();
      } else {
        setErrors([data.error || 'Erro ao buscar atualizações.']);
      }
    } catch (error) {
      setErrors(['Erro de conexão ao buscar atualizações.']);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getDateFilterLabel = () => {
    const labels: Record<string, string> = {
      today: 'Hoje', yesterday: 'Dia anterior', last3days: 'Últimos 3 dias',
      lastweek: 'Última semana', lastmonth: 'Último mês', last2months: 'Últimos 2 meses',
      last3months: 'Últimos 3 meses', custom: 'Personalizado'
    };
    return labels[dateFilter] || 'Hoje';
  };

  if (!isAuthenticated) return null;

  const { stats, authors, teamStatusAuthors, advancedMetrics, recentCommits } = dashboardData;

  const authorsForStatus = teamStatusAuthors && teamStatusAuthors.length > 0 
    ? [...teamStatusAuthors].sort((a: any, b: any) => new Date(a.lastCommitDate).getTime() - new Date(b.lastCommitDate).getTime())
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation />
      <div className="flex-1 lg:ml-0">
        <div className="mx-auto lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Monitoramento de produtividade da equipe</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={handleFetchRepositories} disabled={isFetching || isLoading} className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                  <DownloadCloud className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Buscar Atualizações
                </button>
                <button onClick={loadDashboardData} disabled={isLoading || isFetching} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading && !isFetching ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-gray-800 font-medium">Período:</span>
                <select value={dateFilter} onChange={(e) => handleDateFilterChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" disabled={isLoading || isFetching}>
                  <option value="today">Hoje</option>
                  <option value="yesterday">Dia anterior</option>
                  <option value="last3days">Últimos 3 dias</option>
                  <option value="lastweek">Última semana</option>
                  <option value="lastmonth">Último mês</option>
                  <option value="last2months">Últimos 2 meses</option>
                  <option value="last3months">Últimos 3 meses</option>
                  <option value="custom">Personalizado</option>
                </select>
                {dateFilter === 'custom' && (
                  <>
                    <input type="date" value={customStartDate} onChange={(e) => handleCustomDateChange(e.target.value, customEndDate)} className="px-3 py-2 border border-gray-300 rounded-md" disabled={isLoading || isFetching} />
                    <span className="text-gray-800">até</span>
                    <input type="date" value={customEndDate} onChange={(e) => handleCustomDateChange(customStartDate, e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md" disabled={isLoading || isFetching} />
                  </>
                )}
              </div>
            </div>

            {/* Notificações */}
            {notifications.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-green-800 font-medium">Sucesso:</h4>
                    <ul className="text-green-700 text-sm mt-1 list-disc list-inside">
                      {notifications.map((msg, index) => <li key={index}>{msg}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Erros */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-medium">Avisos:</h4>
                    <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                      {errors.map((error, index) => <li key={index}>{error}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Cards de Métricas */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse h-48"><div className="h-full bg-gray-200 rounded"></div></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard title="Total de Commits" value={stats.totalCommits} icon={GitCommit} iconColor="text-blue-600" trend={{ value: advancedMetrics.weeklyTrend, label: "vs semana anterior" }} />
                  <MetricCard title="Autores Ativos" value={stats.totalAuthors} icon={Users} iconColor="text-green-600" />
                  <MetricCard title="Commits Hoje" value={stats.commitsToday} icon={TrendingUp} iconColor="text-purple-600" />
                  <MetricCard title="Repositórios" value={stats.totalRepositories} icon={Calendar} iconColor="text-orange-600" />
                  <MetricCard title="Score de Produtividade" value={`${advancedMetrics.productivityScore}%`} icon={Target} iconColor="text-indigo-600" />
                  <MetricCard title="Hora Mais Ativa" value={advancedMetrics.mostActiveHour} icon={Clock} iconColor="text-pink-600" />
                  <MetricCard title="Linhas/Commit" value={advancedMetrics.avgLinesPerCommit} icon={Code} iconColor="text-cyan-600" />
                  <MetricCard title="Commits/Dia" value={advancedMetrics.avgCommitsPerDay} icon={Activity} iconColor="text-emerald-600" />
                </div>

                {/* Gráficos e Tabelas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Commits ({getDateFilterLabel()})</h3>
                    <CommitTimeline data={advancedMetrics.timelineData} />
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Equipe</h3>
                    {authorsForStatus.length > 0 ? (
                      <ul className="space-y-3">
                        {authorsForStatus.map((author: any) => {
                          const lastCommitDate = new Date(author.lastCommitDate);
                          const daysSinceLastCommit = differenceInDays(startOfDay(new Date()), startOfDay(lastCommitDate));
                          
                          let statusMessage;
                          let statusColor;
                          let bgColor;

                          if (isToday(lastCommitDate)) {
                            statusMessage = `${author.name.split(' ')[0]} realizou commit hoje.`;
                            statusColor = 'text-green-600';
                            bgColor = 'bg-green-500';
                          } else if (daysSinceLastCommit === 1) {
                            statusMessage = `${author.name.split(' ')[0]} não realiza um commit há 1 dia.`;
                            statusColor = 'text-yellow-600';
                            bgColor = 'bg-yellow-500';
                          } else if (daysSinceLastCommit > 1 && daysSinceLastCommit <= 7) {
                            statusMessage = `${author.name.split(' ')[0]} não realiza um commit há ${daysSinceLastCommit} dias.`;
                            statusColor = 'text-orange-500';
                            bgColor = 'bg-orange-500';
                          } else {
                            statusMessage = `${author.name.split(' ')[0]} não realiza um commit há ${daysSinceLastCommit} dias.`;
                            statusColor = 'text-red-600';
                            bgColor = 'bg-red-500';
                          }

                          return (
                            <li key={author.email} className="flex items-center">
                              <span className={`h-2 w-2 rounded-full mr-3 ${bgColor}`}></span>
                              <span className={`text-sm ${statusColor}`}>{statusMessage}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma atividade de autor encontrada.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Commits por Autor (Top 10)</h3>
                  <AuthorActivity data={advancedMetrics.authorActivityData} />
                </div>

                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Autores ({getDateFilterLabel()})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inserções</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleções</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Commit</th>
                      </tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {authors.map((author: Author) => (
                          <tr key={author.email}>                            
                            <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{author.name}</div><div className="text-sm text-gray-500">{author.email}</div></td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{author.totalCommits}</td>
                            <td className="px-6 py-4 text-sm text-green-600 font-medium">+{author.totalInsertions.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-red-600 font-medium">-{author.totalDeletions.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(author.lastCommitDate), 'dd/MM/yyyy HH:mm')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
