'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FolderOpen, GitBranch, AlertCircle, CheckCircle, Folder } from 'lucide-react';
import Navigation from '@/components/Navigation';
import DirectorySelector from '@/components/DirectorySelector';
import { useAuth } from '@/hooks/useAuth';
import { StorageService } from '@/lib/storage';
import { Repository } from '@/types';

export default function RepositoriesPage() {
  const { isAuthenticated } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [newRepo, setNewRepo] = useState({ name: '', path: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectorySelector, setShowDirectorySelector] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadRepositories();
    }
  }, [isAuthenticated]);

  const loadRepositories = async () => {
    try {
      const repos = await StorageService.getRepositories();
      setRepositories(repos);
    } catch (error) {
      console.error('Erro ao carregar repositórios:', error);
      setError('Erro ao carregar repositórios');
    }
  };

  const handleAddRepository = async () => {
    if (!newRepo.name.trim() || !newRepo.path.trim()) {
      setError('Selecione um repositório Git válido');
      return;
    }

    try {
      const addedRepo = await StorageService.addRepository({
        name: newRepo.name.trim(),
        path: newRepo.path.trim(),
      });

      setRepositories(prev => [...prev, addedRepo]);
      setNewRepo({ name: '', path: '' });
      setIsAdding(false);
      setError(null);
    } catch (error) {
      console.error('Erro ao adicionar repositório:', error);
      setError('Erro ao adicionar repositório');
    }
  };

  const handleRemoveRepository = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este repositório?')) {
      try {
        await StorageService.removeRepository(id);
        setRepositories(prev => prev.filter(repo => repo.id !== id));
      } catch (error) {
        console.error('Erro ao remover repositório:', error);
        setError('Erro ao remover repositório');
      }
    }
  };

  const handleDirectorySelect = (path: string, name: string) => {
    setNewRepo({ name, path });
    setShowDirectorySelector(false);
    setError(null);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Repositórios
          </h1>
          <p className="text-gray-600">
            Configure os repositórios Git locais para monitoramento
          </p>
        </div>

        {/* Formulário para adicionar repositório */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Adicionar Repositório
            </h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Repositório
            </button>
          </div>

          {isAdding && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Repositório Git
                  </label>
                  
                  {newRepo.path ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <GitBranch className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900">{newRepo.name}</h4>
                        <p className="text-sm text-green-700 font-mono">{newRepo.path}</p>
                      </div>
                      <button
                        onClick={() => setNewRepo({ name: '', path: '' })}
                        className="px-3 py-1 text-sm bg-green-200 text-green-800 rounded hover:bg-green-300 transition-colors"
                      >
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDirectorySelector(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Folder className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600">Clique para selecionar um repositório Git</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddRepository}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewRepo({ name: '', path: '' });
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de repositórios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Repositórios Configurados ({repositories.length})
            </h2>
          </div>

          {repositories.length === 0 ? (
            <div className="p-8 text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum repositório configurado
              </h3>
              <p className="text-gray-600 mb-4">
                Adicione repositórios Git locais para começar o monitoramento
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar Primeiro Repositório
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {repositories.map((repo) => (
                <div key={repo.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GitBranch className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                        <p className="text-sm text-gray-600 font-mono">{repo.path}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Ativo</span>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveRepository(repo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover repositório"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                Dicas para configuração
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use o seletor de diretório para navegar e escolher repositórios Git</li>
                <li>• Apenas diretórios com repositórios Git válidos (.git) podem ser selecionados</li>
                <li>• Após adicionar, vá em Configurações para sincronizar os dados</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Directory Selector Modal */}
      <DirectorySelector
        isOpen={showDirectorySelector}
        onSelect={handleDirectorySelect}
        onClose={() => setShowDirectorySelector(false)}
      />
    </div>
  );
}