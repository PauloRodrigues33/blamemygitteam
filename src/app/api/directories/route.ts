import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

export interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isGitRepo: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { path: requestedPath } = await request.json();
    
    // Se não foi fornecido um caminho, usar o diretório home do usuário
    const targetPath = requestedPath || homedir();
    
    // Verificar se o caminho existe
    if (!existsSync(targetPath)) {
      return NextResponse.json({ error: 'Diretório não encontrado' }, { status: 404 });
    }

    const items = await readdir(targetPath);
    const directoryItems: DirectoryItem[] = [];

    for (const item of items) {
      // Pular arquivos/diretórios ocultos (que começam com .)
      if (item.startsWith('.') && item !== '..') continue;

      const itemPath = join(targetPath, item);
      
      try {
        const stats = await stat(itemPath);
        
        if (stats.isDirectory()) {
          // Verificar se é um repositório Git
          const gitPath = join(itemPath, '.git');
          const isGitRepo = existsSync(gitPath);
          
          directoryItems.push({
            name: item,
            path: itemPath,
            isDirectory: true,
            isGitRepo
          });
        }
      } catch (error) {
        // Ignorar itens que não podem ser acessados
        console.warn(`Não foi possível acessar: ${itemPath}`, error);
      }
    }

    // Adicionar item para voltar ao diretório pai (se não estiver na raiz)
    if (targetPath !== '/' && targetPath !== homedir()) {
      const parentPath = join(targetPath, '..');
      directoryItems.unshift({
        name: '..',
        path: parentPath,
        isDirectory: true,
        isGitRepo: false
      });
    }

    // Ordenar: diretórios primeiro, depois por nome
    directoryItems.sort((a, b) => {
      if (a.name === '..') return -1;
      if (b.name === '..') return 1;
      if (a.isGitRepo && !b.isGitRepo) return -1;
      if (!a.isGitRepo && b.isGitRepo) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      currentPath: targetPath,
      items: directoryItems
    });

  } catch (error) {
    console.error('Erro ao listar diretórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}