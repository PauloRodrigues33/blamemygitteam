'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, Users, GitCommit, TrendingUp, Filter, RefreshCw, AlertCircle,
  Clock, Code, Activity, Target, Zap, BarChart3, PieChart, LineChart,
  FileText, GitBranch, Hash, Timer
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import { CommitTimeline, AuthorActivity, ProductivityDistribution, HourlyActivity } from '@/components/Charts';
import { useAuth } from '@/hooks/useAuth';
import { StorageService } from '@/lib/storage';
import { GitCommit as GitCommitType, Repository, Author, DashboardStats } from '@/types';
import { format, startOfDay, endOfDay, subDays, getHours } from 'date-fns';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCommits: 0,
    totalAuthors: 0,
    totalRepositories: 0,
    commitsToday: 0,
  });
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRepositories();
      loadDateFilterPreference();
    }
  }, [isAuthenticated]);

  const loadRepositories = async () => {
    try {
      const repos = await StorageService.getRepositories();
      setRepositories(repos);
    } catch (error) {
      console.error('Erro ao carregar repositórios:', error);
      setRepositories([]);
    }
  };

  const loadDateFilterPreference = () => {
    try {
      const preference = StorageService.getDateFilterPreference();
      setDateFilter(preference.dateFilter);
      setCustomStartDate(preference.customStartDate || '');
      setCustomEndDate(preference.customEndDate || '');
    } catch (error) {
      console.error('Erro ao carregar preferência do filtro:', error);
    }
  };

  const handleDateFilterChange = (newFilter: string) => {
    setDateFilter(newFilter);
    StorageService.setDateFilterPreference(newFilter, customStartDate, customEndDate);
  };

  const handleCustomStartDateChange = (date: string) => {
    setCustomStartDate(date);
    StorageService.setDateFilterPreference(dateFilter, date, customEndDate);
  };

  const handleCustomEndDateChange = (date: string) => {
    setCustomEndDate(date);
    StorageService.setDateFilterPreference(dateFilter, customStartDate, date);
  };

  // Métricas avançadas calculadas
  const advancedMetrics = useMemo(() => {
    if (commits.length === 0) {
      return {
        avgCommitsPerDay: 0,
        avgLinesPerCommit: 0,
        mostActiveHour: 'N/A',
        productivityScore: 0,
        codeChurn: 0,
        commitFrequency: 0,
        topRepository: 'N/A',
        weeklyTrend: 0,
        timelineData: [],
        authorActivityData: [],
        productivityData: [],
        hourlyData: []
      };
    }

    // Commits por dia
    const daysWithCommits = new Set(commits.map(c => format(new Date(c.date), 'yyyy-MM-dd'))).size;
    const avgCommitsPerDay = daysWithCommits > 0 ? commits.length / daysWithCommits : 0;

    // Linhas por commit
    const totalLines = commits.reduce((sum, c) => sum + c.insertions + c.deletions, 0);
    const avgLinesPerCommit = commits.length > 0 ? totalLines / commits.length : 0;

    // Hora mais ativa
    const hourCounts = commits.reduce((acc, commit) => {
      const hour = getHours(new Date(commit.date));
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostActiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // Score de produtividade (baseado em commits, linhas e frequência)
    const productivityScore = Math.min(100, Math.round(
      (avgCommitsPerDay * 10) + 
      (avgLinesPerCommit / 10) + 
      (commits.length / 10)
    ));

    // Code churn (relação entre adições e remoções)
    const totalInsertions = commits.reduce((sum, c) => sum + c.insertions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
    const codeChurn = totalDeletions > 0 ? (totalDeletions / totalInsertions) * 100 : 0;

    // Frequência de commits (commits por autor ativo)
    const activeAuthors = new Set(commits.map(c => c.email)).size;
    const commitFrequency = activeAuthors > 0 ? commits.length / activeAuthors : 0;

    // Repositório mais ativo
    const repoCounts = commits.reduce((acc, commit) => {
      acc[commit.repository] = (acc[commit.repository] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topRepository = Object.entries(repoCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]?.split('/').pop() || 'N/A';

    // Tendência semanal
    const lastWeek = subDays(new Date(), 7);
    const recentCommits = commits.filter(c => new Date(c.date) >= lastWeek);
    const previousWeek = commits.filter(c => {
      const date = new Date(c.date);
      return date >= subDays(lastWeek, 7) && date < lastWeek;
    });
    
    const weeklyTrend = previousWeek.length > 0 
      ? ((recentCommits.length - previousWeek.length) / previousWeek.length) * 100 
      : recentCommits.length > 0 ? 100 : 0;

    // Dados para gráficos
    const timelineData = Object.entries(
      commits.reduce((acc, commit) => {
        const date = format(new Date(commit.date), 'dd/MM');
        if (!acc[date]) {
          acc[date] = { date, commits: 0, authors: new Set() };
        }
        acc[date].commits++;
        acc[date].authors.add(commit.email);
        return acc;
      }, {} as Record<string, { date: string; commits: number; authors: Set<string> }>)
    ).map(([, data]) => ({
      date: data.date,
      commits: data.commits,
      authors: data.authors.size
    })).slice(-14); // Últimos 14 dias

    const authorActivityData = authors.slice(0, 10).map(author => ({
      name: author.name.split(' ')[0], // Primeiro nome apenas
      email: author.email,
      commits: author.totalCommits,
      insertions: author.totalInsertions,
      deletions: author.totalDeletions
    }));

    const productivityData = [
      { name: 'Alto', value: authors.filter(a => a.totalCommits >= 10).length, color: '#10B981' },
      { name: 'Médio', value: authors.filter(a => a.totalCommits >= 5 && a.totalCommits < 10).length, color: '#F59E0B' },
      { name: 'Baixo', value: authors.filter(a => a.totalCommits < 5).length, color: '#EF4444' }
    ];

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0'),
      commits: hourCounts[hour] || 0
    }));

    return {
      avgCommitsPerDay: Math.round(avgCommitsPerDay * 10) / 10,
      avgLinesPerCommit: Math.round(avgLinesPerCommit),
      mostActiveHour: mostActiveHour !== 'N/A' ? `${mostActiveHour}h` : 'N/A',
      productivityScore,
      codeChurn: Math.round(codeChurn),
      commitFrequency: Math.round(commitFrequency * 10) / 10,
      topRepository,
      weeklyTrend: Math.round(weeklyTrend),
      timelineData,
      authorActivityData,
      productivityData,
      hourlyData
    };
  }, [commits, authors]);

  const processCommitsData = useCallback((commitsData: GitCommitType[]) => {
    // Processar autores
    const authorsMap = new Map<string, Author>();
    
    commitsData.forEach(commit => {
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
      
      // Atualizar a data do último commit se este commit for mais recente
      if (commit.date > author.lastCommitDate) {
        author.lastCommitDate = commit.date;
      }
    });

    const authorsArray = Array.from(authorsMap.values())
      .sort((a, b) => b.totalCommits - a.totalCommits);

    setAuthors(authorsArray);

    // Calcular estatísticas
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    const commitsToday = commitsData.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= todayStart && commitDate <= todayEnd;
    }).length;

    setStats({
      totalCommits: commitsData.length,
      totalAuthors: authorsArray.length,
      totalRepositories: repositories.length,
      commitsToday,
    });
  }, [repositories.length]);

  const loadCommits = useCallback(async () => {
    if (repositories.length === 0) return;

    setIsLoading(true);
    setErrors([]);
    
    // Limpar dados anteriores
    setCommits([]);
    setAuthors([]);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: repositories,
          dateFilter: filterData
        }),
      });

      const data = await response.json();

      if (response.ok && data.commits) {
        setCommits(data.commits);
        processCommitsData(data.commits);
        
        // Se há erros mas também há commits, mostrar os erros como avisos
        if (data.errors && data.errors.length > 0) {
          console.warn('Avisos ao carregar commits:', data.errors);
        }
      } else {
        setErrors([data.error || 'Erro ao carregar commits']);
      }
    } catch (error) {
      setErrors(['Erro ao conectar com o servidor']);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, dateFilter, customStartDate, customEndDate, processCommitsData]);

  useEffect(() => {
    setCommits([]);
    setAuthors([]);
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (repositories.length > 0) {
      loadCommits();
    }
  }, [repositories, dateFilter, customStartDate, customEndDate, loadCommits]);

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Dia anterior';
      case 'last3days': return 'Últimos 3 dias';
      case 'lastweek': return 'Última semana';
      case 'lastmonth': return 'Último mês';
      case 'last2months': return 'Últimos 2 meses';
      case 'last3months': return 'Últimos 3 meses';
      case 'custom': return 'Personalizado';
      default: return 'Hoje';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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
            <button
              onClick={loadCommits}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-800 font-medium">Período:</span>
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={isLoading}
              >
                <option value="today">Hoje</option>
                <option value="yesterday">Dia anterior</option>
                <option value="last3days">Últimos 3 dias</option>
                <option value="lastweek">Última semana</option>
                <option value="lastmonth">Último mês</option>
                <option value="last2months">Últimos 2 meses</option>
                <option value="last3months">Últimos 3 meses</option>
                <option value="custom">Personalizado</option>
              </select>
              {isLoading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin ml-2" />}
              
              {dateFilter === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => handleCustomStartDateChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    disabled={isLoading}
                  />
                  <span className="text-gray-800">até</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => handleCustomEndDateChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    disabled={isLoading}
                  />
                  {isLoading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin ml-2" />}
                </>
              )}
            </div>
          </div>

          {/* Erros */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div className="text-red-800">
                  <h4 className="text-red-800 font-medium">Avisos:</h4>
                  <ul className="text-red-700 text-sm mt-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Cards de Métricas Principais */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-12 bg-gray-300 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-full mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total de Commits"
                value={stats.totalCommits}
                icon={GitCommit}
                iconColor="text-blue-600"
                trend={{ value: advancedMetrics.weeklyTrend, label: "vs semana anterior" }}
                modalTitle="Detalhes dos Commits"
                modalContent={
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Média por dia</p>
                        <p className="text-2xl font-bold text-gray-900">{advancedMetrics.avgCommitsPerDay}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Linhas por commit</p>
                        <p className="text-2xl font-bold text-gray-900">{advancedMetrics.avgLinesPerCommit}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Timeline de Commits</h4>
                      <CommitTimeline data={advancedMetrics.timelineData} />
                    </div>
                  </div>
                }
                size="xl"
              />

              <MetricCard
                 title="Autores Ativos"
                 value={stats.totalAuthors}
                 icon={Users}
                 iconColor="text-green-600"
                 modalTitle="Atividade dos Autores"
                 modalContent={
                   <div className="space-y-6">
                     <div>
                       <h4 className="text-lg font-semibold mb-3 text-gray-800">Atividade por Autor</h4>
                       <AuthorActivity data={advancedMetrics.authorActivityData} />
                     </div>
                     <div>
                       <h4 className="text-lg font-semibold mb-3 text-gray-800">Distribuição de Produtividade</h4>
                       <ProductivityDistribution data={advancedMetrics.productivityData} />
                     </div>
                   </div>
                 }
                 size="xl"
               />

              <MetricCard
                title="Commits Hoje"
                value={stats.commitsToday}
                icon={TrendingUp}
                iconColor="text-purple-600"
                modalTitle="Atividade por Hora"
                modalContent={
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Hora mais ativa</p>
                      <p className="text-2xl font-bold text-gray-900">{advancedMetrics.mostActiveHour}</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-gray-800">Distribuição por Hora</h4>
                      <HourlyActivity data={advancedMetrics.hourlyData} />
                    </div>
                  </div>
                }
                size="xl"
              />

              <MetricCard
                title="Repositórios"
                value={stats.totalRepositories}
                icon={Calendar}
                iconColor="text-orange-600"
                modalTitle="Repositórios Ativos"
                modalContent={
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Mais ativo</p>
                      <p className="text-lg font-bold text-gray-900">{advancedMetrics.topRepository}</p>
                    </div>
                    <div className="space-y-2">
                      {repositories.map((repo, index) => (
                        <div key={repo.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{repo.name}</span>
                          <span className="text-sm text-gray-600">{repo.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
                size="lg"
              />
            </div>
          )}

          {/* Cards de Métricas Avançadas */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-7 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-10 bg-gray-300 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Score de Produtividade"
                value={`${advancedMetrics.productivityScore}%`}
                icon={Target}
                iconColor="text-indigo-600"
                modalTitle="Análise de Produtividade"
                modalContent={
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Frequência de commits</p>
                        <p className="text-xl font-bold text-gray-900">{advancedMetrics.commitFrequency}</p>
                        <p className="text-xs text-gray-500">commits/autor</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Code churn</p>
                        <p className="text-xl font-bold text-gray-900">{advancedMetrics.codeChurn}%</p>
                        <p className="text-xs text-gray-500">remoções/adições</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Como é calculado?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Média de commits por dia</li>
                        <li>• Linhas de código por commit</li>
                        <li>• Frequência de contribuições</li>
                        <li>• Consistência temporal</li>
                      </ul>
                    </div>
                  </div>
                }
                size="lg"
              />

              <MetricCard
                title="Hora Mais Ativa"
                value={advancedMetrics.mostActiveHour}
                icon={Clock}
                iconColor="text-pink-600"
                modalTitle="Padrões de Atividade"
                modalContent={
                  <div className="space-y-4">
                    <HourlyActivity data={advancedMetrics.hourlyData} />
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">💡 Insights</h4>
                      <p className="text-sm text-yellow-800">
                        Identifique os horários de maior produtividade da equipe para otimizar reuniões e processos.
                      </p>
                    </div>
                  </div>
                }
                size="lg"
              />

              <MetricCard
                title="Linhas/Commit"
                value={advancedMetrics.avgLinesPerCommit}
                icon={Code}
                iconColor="text-cyan-600"
                modalTitle="Análise de Código"
                modalContent={
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Total Adições</p>
                        <p className="text-xl font-bold text-green-900">
                          {commits.reduce((sum, c) => sum + c.insertions, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Total Remoções</p>
                        <p className="text-xl font-bold text-red-900">
                          {commits.reduce((sum, c) => sum + c.deletions, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Interpretação</h4>
                      <p className="text-sm text-gray-600">
                        Commits menores (50-200 linhas) geralmente indicam melhor qualidade e facilidade de revisão.
                      </p>
                    </div>
                  </div>
                }
                size="lg"
              />

              <MetricCard
                title="Commits/Dia"
                value={advancedMetrics.avgCommitsPerDay}
                icon={Activity}
                iconColor="text-emerald-600"
                modalTitle="Frequência de Commits"
                modalContent={
                  <div className="space-y-4">
                    <CommitTimeline data={advancedMetrics.timelineData} />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Ideal</p>
                        <p className="text-lg font-bold text-green-600">3-5</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Atual</p>
                        <p className="text-lg font-bold text-gray-900">{advancedMetrics.avgCommitsPerDay}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Status</p>
                        <p className={`text-lg font-bold ${
                          advancedMetrics.avgCommitsPerDay >= 3 && advancedMetrics.avgCommitsPerDay <= 5 
                            ? 'text-green-600' 
                            : advancedMetrics.avgCommitsPerDay > 5 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                        }`}>
                          {advancedMetrics.avgCommitsPerDay >= 3 && advancedMetrics.avgCommitsPerDay <= 5 
                            ? '✓' 
                            : advancedMetrics.avgCommitsPerDay > 5 
                              ? '⚠' 
                              : '⚠'}
                        </p>
                      </div>
                    </div>
                  </div>
                }
                size="lg"
              />
            </div>
          )}

          {/* Seção de Alertas e Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas de Produtividade */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                Alertas de Produtividade
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Alertas de autores sem commits hoje */}
                {(() => {
                  const today = startOfDay(new Date());
                  const authorsNoCommitsToday = authors.filter(author => 
                    author.totalCommits > 0 && 
                    !author.commits.some(commit => 
                      startOfDay(new Date(commit.date)).getTime() === today.getTime()
                    )
                  );
                  
                  return authorsNoCommitsToday.slice(0, 3).map(author => (
                    <div key={`no-commits-today-${author.email}`} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        <strong>🚨 {author.name}</strong> não realizou nenhum commit hoje
                      </p>
                    </div>
                  ));
                })()}

                {/* Alertas de autores sem commits nos últimos 3 dias */}
                {(() => {
                  const threeDaysAgo = subDays(new Date(), 3);
                  const authorsNoCommits3Days = authors.filter(author => 
                    author.totalCommits > 0 && 
                    new Date(author.lastCommitDate) < threeDaysAgo
                  );
                  
                  return authorsNoCommits3Days.slice(0, 2).map(author => {
                    const daysSinceLastCommit = Math.floor(
                      (new Date().getTime() - new Date(author.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <div key={`no-commits-3days-${author.email}`} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-sm text-orange-800">
                          <strong>⚠️ {author.name}</strong> não realizou nenhum commit nos últimos {daysSinceLastCommit} dias
                        </p>
                      </div>
                    );
                  });
                })()}

                {/* Alertas de commits muito grandes */}
                {(() => {
                  const authorsWithLargeCommits = authors.filter(author => {
                    const avgLinesPerCommit = author.totalCommits > 0 ? 
                      (author.totalInsertions + author.totalDeletions) / author.totalCommits : 0;
                    return avgLinesPerCommit > 500;
                  });
                  
                  return authorsWithLargeCommits.slice(0, 2).map(author => {
                    const avgLines = Math.round((author.totalInsertions + author.totalDeletions) / author.totalCommits);
                    return (
                      <div key={`large-commits-${author.email}`} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>📏 {author.name}</strong> tem commits muito grandes (média: {avgLines} linhas)
                        </p>
                      </div>
                    );
                  });
                })()}

                {/* Alertas de alta produtividade */}
                {(() => {
                  const highProductivityAuthors = authors.filter(author => {
                    const commitsPerDay = author.totalCommits / Math.max(1, 
                      Math.ceil((new Date().getTime() - new Date(author.commits[0]?.date || new Date()).getTime()) / (1000 * 60 * 60 * 24))
                    );
                    return commitsPerDay > 3 && author.totalCommits > 10;
                  });
                  
                  return highProductivityAuthors.slice(0, 2).map(author => (
                    <div key={`high-productivity-${author.email}`} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>🚀 {author.name}</strong> está muito produtivo! ({author.totalCommits} commits)
                      </p>
                    </div>
                  ));
                })()}

                {/* Alertas de code churn alto */}
                {(() => {
                  const highChurnAuthors = authors.filter(author => {
                    const churnRatio = author.totalInsertions > 0 ? 
                      author.totalDeletions / author.totalInsertions : 0;
                    return churnRatio > 0.5 && author.totalCommits > 5;
                  });
                  
                  return highChurnAuthors.slice(0, 2).map(author => {
                    const churnRatio = Math.round((author.totalDeletions / author.totalInsertions) * 100);
                    return (
                      <div key={`high-churn-${author.email}`} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-sm text-purple-800">
                          <strong>🔄 {author.name}</strong> tem alto code churn ({churnRatio}% de deleções)
                        </p>
                      </div>
                    );
                  });
                })()}

                {/* Alertas gerais da equipe */}
                {advancedMetrics.avgCommitsPerDay < 1 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>⚠️ Equipe:</strong> Baixa atividade geral (menos de 1 commit/dia)
                    </p>
                  </div>
                )}

                {authors.filter(a => a.totalCommits === 0).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Equipe:</strong> {authors.filter(a => a.totalCommits === 0).length} autores sem commits no período
                    </p>
                  </div>
                )}

                {advancedMetrics.productivityScore >= 80 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>✅ Equipe:</strong> Excelente produtividade geral!
                    </p>
                  </div>
                )}

                {/* Mensagem quando não há alertas */}
                {(() => {
                  const today = startOfDay(new Date());
                  const threeDaysAgo = subDays(new Date(), 3);
                  
                  const hasAnyAlert = 
                    authors.some(author => 
                      author.totalCommits > 0 && 
                      !author.commits.some(commit => 
                        startOfDay(new Date(commit.date)).getTime() === today.getTime()
                      )
                    ) ||
                    authors.some(author => 
                      author.totalCommits > 0 && 
                      new Date(author.lastCommitDate) < threeDaysAgo
                    ) ||
                    advancedMetrics.avgCommitsPerDay < 1 ||
                    authors.filter(a => a.totalCommits === 0).length > 0;

                  return !hasAnyAlert && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>🎉 Tudo certo!</strong> Nenhum alerta de produtividade no momento
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Commits Recentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Commits Recentes</h3>
              </div>
              <div className="p-6">
                {commits.length === 0 ? (
                  <p className="text-gray-700 text-center">Nenhum commit encontrado</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {commits.slice(0, 10).map((commit) => (
                      <div key={commit.hash} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-900">{commit.author}</p>
                          <span className="text-xs text-gray-700">
                            {format(new Date(commit.date), 'dd/MM HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-1 truncate">{commit.message}</p>
                        <div className="flex items-center text-xs text-gray-700 space-x-4">
                          <span className="truncate">{commit.repository.split('/').pop()}</span>
                          <span className="text-green-600">+{commit.insertions}</span>
                          <span className="text-red-600">-{commit.deletions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

                    {/* Gráfico de Commits por Autor */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : authors.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commits por Autor (Top 10)</h3>
              <div className="space-y-3">
                {advancedMetrics.authorActivityData.map((author, index) => {
                  const maxCommits = advancedMetrics.authorActivityData[0]?.commits || 1;
                  const barWidth = Math.max(10, (author.commits / maxCommits) * 100);
                  const isTop3 = index < 3;
                  const barColor = isTop3 
                    ? index === 0 ? 'bg-yellow-400' 
                    : index === 1 ? 'bg-gray-400' 
                    : 'bg-orange-500'
                    : 'bg-blue-400';
                  return (
                    <div key={author.email} className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${isTop3 ? 'bg-black' : 'bg-gray-600'}`}>
                        {index + 1}
                      </span>
                      <span className="w-32 text-sm font-medium text-gray-900 truncate">{author.name}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className={`${barColor} h-full rounded-full transition-all duration-300`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-sm font-semibold text-gray-700">{author.commits}</span>
                    </div>
                  );
                })}
              </div>
              {authors.length > 3 && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  ... e mais {authors.length - 10} autores
                </div>
              )}
            </div>
          )}

          {/* Tabela de Autores - Largura Total */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Autores ({getDateFilterLabel()})</h3>
              <p className="text-sm text-gray-600 mt-1">Total: {authors.length} autores</p>
            </div>
            <div className="overflow-x-auto">
              {authors.length === 0 ? (
                <p className="text-gray-700 text-center p-6">Nenhum commit encontrado</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Autor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inserções
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deleções
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Commit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {authors.map((author, index) => (
                      <tr key={`${author.email}-${author.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{author.name}</div>
                            <div className="text-sm text-gray-500">{author.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{author.totalCommits}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 font-medium">+{author.totalInsertions.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600 font-medium">-{author.totalDeletions.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(author.lastCommitDate), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(author.lastCommitDate), 'HH:mm')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Informações */}
          {repositories.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-yellow-800">
                  <p className="font-medium">Nenhum repositório configurado</p>
                  <p className="text-sm mt-1">
                    Acesse a página de <a href="/repositories" className="underline">Repositórios</a> para adicionar repositórios Git e começar o monitoramento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
