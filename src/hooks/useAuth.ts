'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '@/lib/storage';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = StorageService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated && typeof window !== 'undefined') {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    StorageService.logout();
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    isAuthenticated,
    logout,
  };
}