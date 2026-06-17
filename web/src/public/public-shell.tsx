import { Outlet } from 'react-router-dom';

import { PublicSidebarShell } from '@/components/design-system';

export function PublicLayout() {
  return (
    <PublicSidebarShell>
      <Outlet />
    </PublicSidebarShell>
  );
}
