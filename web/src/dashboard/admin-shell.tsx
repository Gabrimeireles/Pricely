import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  DatabaseZapIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  PackageSearchIcon,
  ShieldCheckIcon,
  WorkflowIcon,
} from 'lucide-react';

import {
  adminMetrics,
  profileSnapshot,
} from '@/app/mock-data';
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
    label: 'Visão geral',
    icon: LayoutDashboardIcon,
  },
  {
    to: '/dashboard/precos',
    label: 'Preços e ofertas',
    icon: DatabaseZapIcon,
  },
  {
    to: '/dashboard/catalogo',
    label: 'Catálogo',
    icon: PackageSearchIcon,
  },
  {
    to: '/dashboard/listas',
    label: 'Listas',
    icon: ListChecksIcon,
  },
  {
    to: '/dashboard/fila',
    label: 'Fila e saúde',
    icon: WorkflowIcon,
  },
];

export function AdminLayout() {
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
              <span className="text-xs text-sidebar-foreground/70">Área administrativa</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
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
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">Admin Pricely</span>
              <span className="text-xs text-sidebar-foreground/70">
                {profileSnapshot.receiptsShared} contribuições hoje
              </span>
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
                métricas rastreáveis, filas e revisão de catálogo
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
              <Link to="/">Voltar para o público</Link>
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

