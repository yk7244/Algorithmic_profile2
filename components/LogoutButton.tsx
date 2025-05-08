// components/LogoutButton.tsx

'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <Button onClick={handleLogout} className="text-sm bg-red-500 hover:bg-red-600 text-white">
      로그아웃
    </Button>
  );
}
