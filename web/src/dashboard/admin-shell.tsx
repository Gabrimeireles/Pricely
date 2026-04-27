import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  DatabaseZapIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  PackageSearchIcon,
  ShieldCheckIcon,
  WorkflowIcon,
} from 'lucide-react';

import { adminMetrics } from '@/app/mock-data';
import { usePricely } from '@/app/pricely-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const adminNav = [
  {
    to: '/dashboard',
    label: 'Visao geral',
    icon: LayoutDashboardIcon,
  },
  {
    to: '/dashboard/precos',
    label: 'Precos e ofertas',
    icon: DatabaseZapIcon,
  },
  {
    to: '/dashboard/catalogo',
    label: 'Catalogo',
    icon: PackageSearchIcon,
  },
  {
    to: '/dashboard/listas',
    label: 'Listas',
    icon: ListChecksIcon,
  },
  {
    to: '/dashboard/fila',
    label: 'Fila e saude',
    icon: WorkflowIcon,
  },
];

export function AdminLayout() {
  const { currentUser, isAuthenticated } = usePricely();

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10">
        <Alert variant="destructive">
          <ShieldCheckIcon />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            O dashboard administrativo so pode ser acessado por contas admin no web.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <Link className="flex items-center gap-3 rounded-lg px-2 py-2" to="/dashboard">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheckIcon />
            </div>
            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">Pricely</span>
              <span className="text-xs text-sidebar-foreground/70">Area administrativa</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <NavLink
                        className={({ isActive }) =>
                          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                        }
                        to={item.to}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-lg border border-sidebar-border p-2">
            <Avatar className="size-8">
              <AvatarFallback>
                {currentUser.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">{currentUser.displayName}</span>
              <span className="text-xs text-sidebar-foreground/70">{currentUser.email}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/92 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Dashboard restrito a administradores</span>
              <span className="text-xs text-muted-foreground">
                Metricas rastreaveis, filas e revisao de catalogo
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {adminMetrics.slice(0, 2).map((metric) => (
              <Badge key={metric.id} variant="secondary">
                {metric.label}: {metric.value}
              </Badge>
            ))}
            <Button asChild size="sm" variant="outline">
              <Link to="/">Voltar para o publico</Link>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
