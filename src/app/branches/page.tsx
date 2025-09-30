'use client';

import { useState, useEffect } from 'react';
import { 
  GitBranch, Users, Clock, Activity, TrendingUp, Calendar,
  User, Code, FileText, AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import { useAuth } from '@/hooks/useAuth';

import { BranchActivity, DeveloperActivity, BranchStats } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BranchesPage() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [developerActivities, setDeveloperActivities] = useState<DeveloperActivity[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [branchActivities] = useState<BranchActivity[]>([]);
  const [selectedView, setSelectedView] = useState<'branches' | 'developers'>('branches');

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/branches');
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }
      
      const data = await response.json();
      setBranchStats(data.branchStats || []);
      setDeveloperActivities(data.developerActivities || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setBranchStats([]);
      setDeveloperActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (lastActivity: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' };
    if (diffInHours < 72) return { status: 'recent', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'inactive', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const totalActiveBranches = branchStats.filter(branch => {
    const lastActivity = new Date(branch.lastActivity);
    const diffInDays = (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  }).length;

  const totalActiveDevelopers = developerActivities.filter(dev => dev.totalCommitsWeek > 0).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa estar autenticado para acessar esta página.</p>
        </div>
      </div>
    );
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
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <GitBranch className="w-8 h-8 mr-3 text-blue-600" />
                  Dashboard de Branches
                </h1>
                <p className="text-gray-600">
                  Acompanhe as atividades dos desenvolvedores por branches e repositórios
                </p>
              </div>
            </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Branches Ativas"
            value={totalActiveBranches}
            icon={GitBranch}
            iconColor="text-blue-400"
          />
          <MetricCard
            title="Desenvolvedores Ativos"
            value={totalActiveDevelopers}
            icon={Users}
            iconColor="text-green-400"
          />
          <MetricCard
            title="Total de Branches"
            value={branchStats.length}
            icon={Code}
            iconColor="text-purple-400"
          />
          <MetricCard
            title="Repositórios"
            value={new Set(branchStats.map(b => b.repository)).size}
            icon={FileText}
            iconColor="text-orange-400"
          />
        </div>

            {/* Navegação entre views */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedView('branches')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedView === 'branches'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <GitBranch className="w-5 h-5 inline mr-2" />
                  Por Branches
                </button>
                <button
                  onClick={() => setSelectedView('developers')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedView === 'developers'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-5 h-5 inline mr-2" />
                  Por Desenvolvedores
                </button>
              </div>
            </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <>
            {selectedView === 'branches' ? (
              <BranchesView 
                branchActivities={branchActivities}
                branchStats={branchStats}
                getActivityStatus={getActivityStatus}
              />
            ) : (
              <DevelopersView 
                developerActivities={developerActivities}
                getActivityStatus={getActivityStatus}
              />
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para visualização por branches
function BranchesView({ 
  branchActivities, 
  branchStats, 
  getActivityStatus 
}: { 
  branchActivities: BranchActivity[];
  branchStats: BranchStats[];
  getActivityStatus: (date: Date) => { status: string; color: string; bg: string };
}) {
  const groupedByBranch = branchActivities.reduce((acc, activity) => {
    const key = `${activity.repository}/${activity.branch}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(activity);
    return acc;
  }, {} as Record<string, BranchActivity[]>);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Atividades por Branch</h2>
      
      {Object.entries(groupedByBranch).map(([branchKey, activities]) => {
        const [repository, branch] = branchKey.split('/');
        const branchStat = branchStats.find(s => s.branch === branch && s.repository === repository);
        const lastActivity = Math.max(...activities.map(a => new Date(a.lastCommit).getTime()));
        const status = getActivityStatus(new Date(lastActivity));
        
        return (
          <div key={branchKey} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <GitBranch className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {branch}
                  </h3>
                  <p className="text-gray-600 text-sm">{repository}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                  {status.status === 'active' ? 'Ativo' : status.status === 'recent' ? 'Recente' : 'Inativo'}
                </span>
                <div className="text-right">
                  <p className="text-gray-900 font-semibold">{branchStat?.totalCommits || 0} commits</p>
                  <p className="text-gray-600 text-sm">{branchStat?.totalAuthors || 0} desenvolvedores</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-900 font-medium">{activity.author}</span>
                    {activity.isActive && (
                      <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                    )}
                  </div>
                  <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                    {activity.lastCommitMessage}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{activity.totalCommits} commits</span>
                    <span>{formatDistanceToNow(activity.lastCommit, { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente para visualização por desenvolvedores
function DevelopersView({ 
  developerActivities, 
  getActivityStatus 
}: { 
  developerActivities: DeveloperActivity[];
  getActivityStatus: (date: Date) => { status: string; color: string; bg: string };
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Atividades dos Desenvolvedores</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {developerActivities.map((developer, index) => {
          const status = getActivityStatus(new Date(developer.lastActivity));
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <User className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{developer.author}</h3>
                    <p className="text-gray-600 text-sm">{developer.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                  {status.status === 'active' ? 'Ativo' : status.status === 'recent' ? 'Recente' : 'Inativo'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="text-gray-900 font-medium mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                    Última Atividade
                  </h4>
                  <p className="text-gray-700 text-sm mb-1">{developer.lastCommitMessage}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{developer.lastRepository} / {developer.lastBranch}</span>
                    <span>{formatDistanceToNow(new Date(developer.lastActivity), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center border">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-gray-900 font-semibold">{developer.totalCommitsToday}</span>
                    </div>
                    <p className="text-gray-600 text-xs">Hoje</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-gray-900 font-semibold">{developer.totalCommitsWeek}</span>
                    </div>
                    <p className="text-gray-600 text-xs">Esta semana</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <h5 className="text-gray-900 font-medium mb-2 flex items-center">
                    <GitBranch className="w-4 h-4 mr-2 text-purple-600" />
                    Branches Ativas ({developer.activeBranches.length})
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {developer.activeBranches.slice(0, 5).map((branch, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                        {branch}
                      </span>
                    ))}
                    {developer.activeBranches.length > 5 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        +{developer.activeBranches.length - 5}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <h5 className="text-gray-900 font-medium mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-orange-600" />
                    Repositórios ({developer.repositories.length})
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {developer.repositories.slice(0, 3).map((repo, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                        {repo}
                      </span>
                    ))}
                    {developer.repositories.length > 3 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        +{developer.repositories.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}