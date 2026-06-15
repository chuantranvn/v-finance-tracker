'use client';
import { useAuth } from '@/components/AuthProvider';
import NewsFeed from '@/components/NewsFeed';
import Header from '@/components/Header';
import Login from '@/components/Login';

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-center">Đang tải...</div>;
  if (!user) return <div className="p-6 max-w-md mx-auto"><Login /></div>;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Header />
      <main className="flex justify-center p-6">
        <NewsFeed />
      </main>
    </div>
  );
}
