import { Link, NavLink, Outlet } from 'react-router-dom';
import { MapPinIcon, MoonStarIcon, ShieldCheckIcon, SparklesIcon, SunMediumIcon } from 'lucide-react';

import { usePricely } from '@/app/pricely-context';
import { useTheme } from '@/app/theme-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

function AppLogo() {
  return (
    <Link className="flex items-center gap-3" to="/">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <span className="text-sm font-semibold">P</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold tracking-tight">Pricely</span>
        <span className="text-xs text-muted-foreground">economia com contexto real</span>
      </div>
    </Link>
  );
}

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'text-foreground' : 'text-muted-foreground transition-colors hover:text-foreground';

export function PublicLayout() {
  const { cityId, cities, currentUser, isAuthenticated, isBootstrapping, setCityId, signOut } =
    usePricely();
  const { theme, toggleTheme } = useTheme();
  const activeCity = cityId ? cities.find((city) => city.id === cityId) ?? null : null;
  const shouldRequireCitySelection =
    isAuthenticated && !isBootstrapping && !cityId && cities.length > 0;
  const citySummary = activeCity
    ? `${activeCity.name} - ${activeCity.activeStoreCount} estabelecimentos ativos`
    : 'Escolha uma cidade para carregar ofertas e listas com contexto local';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.14),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.10),transparent_22%),linear-gradient(180deg,#f8fafb_0%,#f3f8f6_48%,#eef7f8_100%)]">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-6">
            <AppLogo />
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <NavLink className={linkClassName} to="/ofertas">
                Ofertas
              </NavLink>
              <NavLink className={linkClassName} to="/cidades">
                Cidades suportadas
              </NavLink>
              <NavLink className={linkClassName} to="/listas">
                Minhas listas
              </NavLink>
              {currentUser?.role === 'admin' ? (
                <NavLink className={linkClassName} to="/dashboard">
                  Dashboard
                </NavLink>
              ) : null}
            </nav>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select onValueChange={(value) => void setCityId(value)} value={cityId ?? ''}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <MapPinIcon />
                <SelectValue placeholder="Escolha sua cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name} - {city.activeStoreCount} estabelecimentos ativos
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2">
              <SunMediumIcon className="size-4 text-muted-foreground" />
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              <MoonStarIcon className="size-4 text-muted-foreground" />
            </div>

            {isAuthenticated ? (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/listas">{currentUser?.displayName ?? 'Minha conta'}</Link>
                </Button>
                <Button onClick={signOut} size="sm" variant="outline">
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/entrar">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/criar-conta">Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 lg:px-6 lg:py-10">
        <div className="grid gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <SparklesIcon className="mt-0.5 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Sua compra continua de onde voce parou</span>
              <span className="text-sm text-muted-foreground">
                A cidade escolhida, as listas salvas e o checklist acompanham a mesma conta.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Cidade ativa</span>
              <span className="text-sm text-muted-foreground">{citySummary}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Cobertura visivel</span>
              <span className="text-sm text-muted-foreground">
                {activeCity?.coverageStatus === 'live'
                  ? 'Ofertas com evidencia disponivel.'
                  : activeCity
                    ? 'Cidade ativa, ainda coletando dados de cobertura.'
                    : 'Selecione uma cidade para ver o nivel de cobertura.'}
              </span>
            </div>
          </div>
        </div>

        <Outlet />
      </main>

      <Dialog open={shouldRequireCitySelection}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Escolha sua cidade para continuar</DialogTitle>
            <DialogDescription>
              A sua cidade fica salva na conta e pode ser trocada depois a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <Select onValueChange={(value) => void setCityId(value)} value={cityId ?? ''}>
            <SelectTrigger>
              <MapPinIcon />
              <SelectValue placeholder="Selecione uma cidade disponivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} - {city.activeStoreCount} estabelecimentos ativos
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!cityId} onClick={() => undefined} type="button">
              Confirmado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
