import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  DatabaseZapIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MapPinnedIcon,
  PackageSearchIcon,
  ShieldCheckIcon,
  StoreIcon,
  WorkflowIcon,
} from 'lucide-react';

import { usePricely } from '@/app/pricely-context';
import { useTheme } from '@/app/theme-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
    to: '/dashboard/regioes',
    label: 'Regioes',
    icon: MapPinnedIcon,
  },
  {
    to: '/dashboard/estabelecimentos',
    label: 'Estabelecimentos',
    icon: StoreIcon,
  },
  {
    to: '/dashboard/produtos',
    label: 'Produtos',
    icon: PackageSearchIcon,
  },
  {
    to: '/dashboard/ofertas',
    label: 'Ofertas',
    icon: DatabaseZapIcon,
  },
  {
    to: '/dashboard/listas',
    label: 'Operacoes de listas',
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
  const { theme, toggleTheme } = useTheme();

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
                Metricas rastreaveis, filas, catalogo e operacao da base
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
            <Badge variant="secondary">Acesso admin</Badge>
            <Button asChild size="sm" variant="outline">
              <Link to="/">Voltar para o publico</Link>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.06),transparent_22%)] px-4 py-6 lg:px-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
