'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '@/lib/storage';
import { GitBranch } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = StorageService.isAuthenticated();
    
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center items-center mb-6">
          <GitBranch className="w-12 h-12 text-blue-400 mr-3 animate-pulse" />
          <h1 className="text-3xl font-bold text-white">Blame My Git Team</h1>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="text-gray-300 mt-4">Carregando...</p>
      </div>
    </div>
  );
}
