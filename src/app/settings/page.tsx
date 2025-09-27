'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Repository } from '@/types';
import Navigation from '@/components/Navigation';
import { 
  Settings as SettingsIcon, 
  Database, 
  RefreshCw, 
  Download, 
  Upload,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const { syncRepositories, loading } = useDatabase();
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      // Carregar repositórios do localStorage
      const localRepos = JSON.parse(localStorage.getItem('repositories') || '[]');
      setRepositories(localRepos);

      // Verificar última sincronização
      const lastSyncTime = localStorage.getItem('lastDatabaseSync');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime).toLocaleString('pt-BR'));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSyncDatabase = async () => {
    setSyncStatus('syncing');
    
    try {
      const localRepos = JSON.parse(localStorage.getItem('repositories') || '[]');
      await syncRepositories(localRepos);
      
      localStorage.setItem('lastDatabaseSync', new Date().toISOString());
      setLastSync(new Date().toLocaleString('pt-BR'));
      setSyncStatus('success');
      
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const exportData = () => {
    try {
      const data = {
        repositories: JSON.parse(localStorage.getItem('repositories') || '[]'),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `git-monitor-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.repositories && Array.isArray(data.repositories)) {
          localStorage.setItem('repositories', JSON.stringify(data.repositories));
          setRepositories(data.repositories);
          alert('Dados importados com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        alert('Erro ao importar dados. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('repositories');
      localStorage.removeItem('lastDatabaseSync');
      setRepositories([]);
      setLastSync(null);
      alert('Dados limpos com sucesso!');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
            <p className="text-gray-600">Gerencie as configurações do sistema e sincronização de dados</p>
          </div>

          {/* Sincronização do Banco de Dados */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Sincronização do Banco de Dados</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Status da Sincronização</p>
                  <p className="text-sm text-gray-600">
                    {lastSync ? `Última sincronização: ${lastSync}` : 'Nunca sincronizado'}
                  </p>
                </div>
                <button
                  onClick={handleSyncDatabase}
                  disabled={loading || syncStatus === 'syncing'}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Agora'}
                </button>
              </div>

              {syncStatus === 'success' && (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <p className="text-green-800">Sincronização concluída com sucesso!</p>
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <p className="text-red-800">Erro na sincronização. Tente novamente.</p>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p>A sincronização irá:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Salvar todos os repositórios configurados no banco de dados</li>
                  <li>Ler e armazenar todos os commits dos repositórios</li>
                  <li>Gerar estatísticas detalhadas para relatórios</li>
                  <li>Permitir análises avançadas de produtividade</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Backup e Restauração */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center mb-4">
              <SettingsIcon className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Backup e Restauração</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Exportar Dados</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Faça backup das configurações dos repositórios
                </p>
                <button
                  onClick={exportData}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Importar Dados</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Restaure configurações de um backup
                </p>
                <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Repositórios Configurados */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Repositórios Configurados</h2>
            
            {repositories.length === 0 ? (
              <p className="text-gray-600">Nenhum repositório configurado.</p>
            ) : (
              <div className="space-y-3">
                {repositories.map((repo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{repo.name}</p>
                      <p className="text-sm text-gray-600">{repo.path}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Ativo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zona de Perigo */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Zona de Perigo</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">Limpar Todos os Dados</h3>
                <p className="text-sm text-red-700 mb-4">
                  Remove todas as configurações e dados armazenados localmente. Esta ação não pode ser desfeita.
                </p>
                <button
                  onClick={clearAllData}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}