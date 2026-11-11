'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard or login based on auth token
    const token = document.cookie
      .split(';')
      .find((cookie) => cookie.trim().startsWith('auth_token='));

    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">FinControl</h1>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
