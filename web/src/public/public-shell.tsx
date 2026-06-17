import { Outlet } from 'react-router-dom';

import { PublicNavbar } from '@/components/design-system';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 py-6 lg:px-6 lg:py-6">
        <Outlet />
      </main>
    </div>
  );
}
