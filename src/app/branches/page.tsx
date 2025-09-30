'use client';

import { useState, useEffect } from 'react';
import { 
  GitBranch, Users, FileText, AlertCircle, User, Calendar
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import Modal from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { RemoteBranch, GitCommit } from '@/types';

export default function BranchesPage() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupedBranches, setGroupedBranches] = useState<Record<string, Record<string, RemoteBranch[]>>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<(RemoteBranch & { repoName: string }) | null>(null);
  const [branchCommits, setBranchCommits] = useState<Partial<GitCommit>[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/branches');
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }
      
      const data = await response.json();
      setGroupedBranches(data.groupedBranches || {});
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setGroupedBranches({});
    } finally {
      setLoading(false);
    }
  };

  const handleBranchClick = async (branch: RemoteBranch & { repoName: string }) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
    setIsLoadingCommits(true);
    try {
      const response = await fetch(`/api/commits?repo=${encodeURIComponent(branch.repoName)}&branch=${encodeURIComponent(branch.name)}`);
      const data = await response.json();
      if (data.commits) {
        setBranchCommits(data.commits);
      }
    } catch (error) {
      console.error("Failed to fetch commits", error);
      setBranchCommits([]);
    } finally {
      setIsLoadingCommits(false);
    }
  };

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

  const totalBranches = Object.values(groupedBranches).flatMap(repos => Object.values(repos).flat()).length;
  const totalDevelopers = Object.keys(groupedBranches).length;
  const totalRepositories = new Set(Object.values(groupedBranches).flatMap(repos => Object.keys(repos))).size;

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
                  Dashboard de Branches Remotas
                </h1>
                <p className="text-gray-600">
                  Branches remotas de todos os repositórios, agrupadas por autor e projeto.
                </p>
              </div>
            </div>

            {/* Métricas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total de Branches"
                value={totalBranches}
                icon={GitBranch}
                iconColor="text-blue-400"
              />
              <MetricCard
                title="Total de Desenvolvedores"
                value={totalDevelopers}
                icon={Users}
                iconColor="text-green-400"
              />
              <MetricCard
                title="Total de Repositórios"
                value={totalRepositories}
                icon={FileText}
                iconColor="text-orange-400"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <BranchesByAuthorView groupedBranches={groupedBranches} onBranchClick={handleBranchClick} />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Últimos 10 commits em ${selectedBranch?.repoName}/${selectedBranch?.name}`}
        size="lg"
      >
        {isLoadingCommits ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {branchCommits.map(commit => (
              <li key={commit.hash} className="border-b border-gray-200 pb-3 last:border-b-0">
                <p className="font-medium text-gray-800 text-sm">{commit.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">por <span className="font-semibold">{commit.author}</span> em {format(new Date(commit.date!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  <p className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{commit.hash?.substring(0, 7)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

function BranchesByAuthorView({ 
  groupedBranches, 
  onBranchClick 
}: { 
  groupedBranches: Record<string, Record<string, RemoteBranch[]>>;
  onBranchClick: (branch: RemoteBranch & { repoName: string }) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Object.entries(groupedBranches).map(([author, repos]) => (
        <div key={author} className="bg-white rounded-lg shadow-md p-4 flex flex-col h-[400px]">
          {/* Author Header */}
          <div className="flex items-center mb-3 flex-shrink-0">
            <User className="w-6 h-6 text-blue-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{author}</h2>
              <p className="text-xs text-gray-500">{Object.values(repos)[0]?.[0]?.authorEmail}</p>
            </div>
          </div>

          {/* Scrollable Branches List */}
          <div className="space-y-1 flex-grow overflow-y-auto pr-2">
            {Object.entries(repos)
              .flatMap(([repoName, branches]) => branches.map(branch => ({ ...branch, repoName })))
              .sort((a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime())
              .map((branch, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-[1fr_auto] items-center p-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => onBranchClick(branch)}
                >
                  <div className="flex items-center truncate">
                    <GitBranch className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-500 mr-2 flex-shrink-0">{branch.repoName}</span>
                    <span className="text-sm text-gray-800 truncate">{branch.name}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 ml-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="whitespace-nowrap">{formatDistanceToNow(new Date(branch.commitDate), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}