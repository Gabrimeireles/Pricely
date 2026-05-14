import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LocateFixedIcon,
  MapPinIcon,
  MoonStarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunMediumIcon,
} from 'lucide-react';
import { useState } from 'react';

import { usePricely } from '@/app/pricely-context';
import { useTheme } from '@/app/theme-context';
import pricelyIcon from '@/assets/pricely-icon.png';
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

function AppLogo() {
  return (
    <Link className="flex items-center gap-3" to="/">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <img
          alt=""
          className="size-8 rounded-md object-cover"
          src={pricelyIcon}
        />
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
  const {
    cityId,
    cities,
    currentUser,
    isAuthenticated,
    isBootstrapping,
    locationPreferences,
    saveBrowserLocation,
    setCityId,
    signOut,
  } = usePricely();
  const { theme, toggleTheme } = useTheme();
  const [locationPermissionState, setLocationPermissionState] = useState<
    'manual' | 'requesting' | 'allowed' | 'denied' | 'unsupported'
  >('manual');
  const activeCity = cityId ? cities.find((city) => city.id === cityId) ?? null : null;
  const activeLocation = activeCity
    ? (locationPreferences ?? []).find(
        (preference) =>
          preference.isDefault && preference.regionSlug === activeCity.id,
      )
    : undefined;
  const shouldRequireCitySelection =
    isAuthenticated && !isBootstrapping && !cityId && cities.length > 0;
  const citySummary = activeCity
    ? `${activeCity.name} - ${activeCity.activeStoreCount} estabelecimentos ativos`
    : 'Escolha uma cidade para carregar ofertas e listas com contexto local';
  const radiusSummary = activeCity
    ? `${activeCity.activeStoreCount} lojas candidatas na cidade · raio local padrão 5 km`
    : 'Raio local padrão 5 km disponível após escolher a cidade';
  const locationRadiusSummary = activeCity
    ? activeLocation
      ? `${activeLocation.activeEstablishmentCount} lojas dentro de ${activeLocation.coverageRadiusKm} km`
      : `${activeCity.activeStoreCount} lojas na cidade - raio local padrao 5 km aguardando localizacao`
    : radiusSummary;

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermissionState('unsupported');
      return;
    }

    setLocationPermissionState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void saveBrowserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          coverageRadiusKm: 5,
        })
          .then(() => setLocationPermissionState('allowed'))
          .catch(() => setLocationPermissionState('denied'));
      },
      () => setLocationPermissionState('denied'),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
    );
  };

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
              <NavLink className={linkClassName} to="/notas">
                Notas fiscais
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

            <Button
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="border-border/80 bg-card/90"
              onClick={toggleTheme}
              size="icon"
              type="button"
              variant="outline"
            >
              {theme === 'dark' ? <SunMediumIcon className="size-4" /> : <MoonStarIcon className="size-4" />}
            </Button>

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

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 lg:px-6 lg:py-8">
        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/90 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <SparklesIcon className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="truncate font-medium">Contexto da compra</div>
              <div className="truncate text-muted-foreground">
                Listas, checklist e cidade ficam sincronizados na sua conta.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/80 px-2.5 py-1">
              <MapPinIcon className="size-3.5" />
              {citySummary}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/80 px-2.5 py-1">
              <ShieldCheckIcon className="size-3.5" />
              {activeCity?.coverageStatus === 'live'
                ? 'Ofertas com evidencia'
                : activeCity
                  ? 'Coletando cobertura'
                  : 'Selecione uma cidade'}
            </span>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-border/70 bg-background/85 px-4 py-3 text-sm shadow-sm lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-medium">
              <LocateFixedIcon className="size-4 text-primary" />
              Localizacao para otimizacao local
            </div>
            <div className="mt-1 text-muted-foreground">
              {locationRadiusSummary}. Modos locais usam essa localizacao salva; modo cidade ignora distancia.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-muted-foreground">
            <span className="rounded-md border border-border/70 bg-card px-2.5 py-1">
              Cidade: {activeCity ? `${activeCity.name} · ${activeCity.stateCode}` : 'manual pendente'}
            </span>
            <span className="rounded-md border border-border/70 bg-card px-2.5 py-1">
              Permissão: {locationPermissionState === 'allowed'
                ? 'capturada para preview'
                : locationPermissionState === 'denied'
                  ? 'negada'
                  : locationPermissionState === 'unsupported'
                    ? 'indisponível'
                    : locationPermissionState === 'requesting'
                      ? 'solicitando'
                      : 'manual'}
            </span>
          </div>
          <Button
            disabled={locationPermissionState === 'requesting'}
            onClick={requestBrowserLocation}
            size="sm"
            type="button"
            variant="outline"
          >
            <LocateFixedIcon data-icon="inline-start" />
            Usar localizacao
          </Button>
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
              <SelectValue placeholder="Selecione uma cidade disponível" />
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
