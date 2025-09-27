'use client';

import { useState, useEffect } from 'react';
import { Folder, FolderOpen, GitBranch, ChevronRight, Home, X } from 'lucide-react';

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isGitRepo: boolean;
}

interface DirectorySelectorProps {
  onSelect: (path: string, name: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function DirectorySelector({ onSelect, onClose, isOpen }: DirectorySelectorProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDirectory();
    }
  }, [isOpen]);

  const loadDirectory = async (path?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/directories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar diretórios');
      }

      const data = await response.json();
      setCurrentPath(data.currentPath);
      setItems(data.items);
    } catch (err) {
      setError('Erro ao carregar diretórios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: DirectoryItem) => {
    if (item.isGitRepo) {
      // Se é um repositório Git, selecionar
      const repoName = item.name;
      onSelect(item.path, repoName);
    } else {
      // Se é um diretório comum, navegar para ele
      loadDirectory(item.path);
    }
  };

  const goHome = () => {
    loadDirectory();
  };

  const getPathSegments = () => {
    if (!currentPath) return [];
    return currentPath.split('/').filter(segment => segment !== '');
  };

  const navigateToSegment = (index: number) => {
    const segments = getPathSegments();
    const newPath = '/' + segments.slice(0, index + 1).join('/');
    loadDirectory(newPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Selecionar Repositório Git
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={goHome}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 rounded transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            
            {getPathSegments().map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateToSegment(index)}
                  className="px-2 py-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {segment}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => loadDirectory(currentPath)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum diretório encontrado
                </p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      item.isGitRepo
                        ? 'hover:bg-green-50 border border-green-200 bg-green-25'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {item.isGitRepo ? (
                        <div className="p-1 bg-green-100 rounded">
                          <GitBranch className="w-4 h-4 text-green-600" />
                        </div>
                      ) : item.name === '..' ? (
                        <FolderOpen className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Folder className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          item.isGitRepo ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {item.name === '..' ? 'Voltar' : item.name}
                        </span>
                        {item.isGitRepo && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Git Repo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {item.path}
                      </p>
                    </div>

                    {!item.isGitRepo && item.name !== '..' && (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 Navegue pelos diretórios e clique em um repositório Git (marcado com 
            <GitBranch className="w-4 h-4 inline mx-1" />) para selecioná-lo.
          </p>
        </div>
      </div>
    </div>
  );
}