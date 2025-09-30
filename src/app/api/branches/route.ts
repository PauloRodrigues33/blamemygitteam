import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Buscar estatísticas de branches
    const branchStats = DatabaseService.getBranchStats();
    
    // Buscar atividades de desenvolvedores
    const developerActivities = DatabaseService.getDeveloperActivities();
    
    return NextResponse.json({
      branchStats,
      developerActivities
    });
  } catch (error) {
    console.error('Erro ao buscar dados de branches:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}