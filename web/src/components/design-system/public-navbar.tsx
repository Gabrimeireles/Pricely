import { useState, type FormEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LocateFixedIcon,
  MapPinIcon,
  MoonStarIcon,
  SunMediumIcon,
} from 'lucide-react';

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
import { Input } from '@/components/ui/input';
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
        <span className="text-xs text-muted-foreground">
          economia com contexto real
        </span>
      </div>
    </Link>
  );
}

const publicNavItems = [
  { label: 'Ofertas', to: '/ofertas' },
  { label: 'Cidades suportadas', to: '/cidades' },
  { label: 'Minhas listas', to: '/listas' },
  { label: 'Notas fiscais', to: '/notas' },
];

export function PublicNavbar() {
  const {
    cityId,
    cities,
    currentUser,
    isAuthenticated,
    isBootstrapping,
    locationPreferences,
    previewLocationCoverage,
    saveBrowserLocation,
    savePostalCodeLocation,
    setCityId,
    signOut,
  } = usePricely();
  const { theme, toggleTheme } = useTheme();
  const [locationPermissionState, setLocationPermissionState] = useState<
    | 'manual'
    | 'requesting'
    | 'allowed'
    | 'denied'
    | 'unsupported'
    | 'postal_fallback'
  >('manual');
  const [postalCode, setPostalCode] = useState('');
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
  const [locationPreview, setLocationPreview] = useState<string | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

  const activeCity = cityId
    ? (cities.find((city) => city.id === cityId) ?? null)
    : null;
  const activeLocation = activeCity
    ? (locationPreferences ?? []).find(
        (preference) =>
          preference.isDefault && preference.regionSlug === activeCity.id,
      )
    : undefined;
  const shouldRequireCitySelection =
    isAuthenticated && !isBootstrapping && !cityId && cities.length > 0;
  const radiusSummary = activeCity
    ? `${activeCity.activeStoreCount} lojas candidatas na cidade · raio local padrão 5 km`
    : 'Raio local padrão 5 km disponível após escolher a cidade';
  const locationRadiusSummary = activeCity
    ? activeLocation
      ? `${activeLocation.activeEstablishmentCount} lojas dentro de ${activeLocation.coverageRadiusKm} km`
      : `${activeCity.activeStoreCount} lojas na cidade - raio local padrao 5 km aguardando localizacao`
    : radiusSummary;
  const activeLocationHasCoordinates =
    activeLocation?.latitude !== null &&
    activeLocation?.latitude !== undefined &&
    activeLocation?.longitude !== null &&
    activeLocation?.longitude !== undefined;
  const locationRadiusDisplay =
    activeLocation && !activeLocationHasCoordinates
      ? `CEP ${activeLocation.postalCode ?? 'salvo'} como fallback: ${activeLocation.activeEstablishmentCount} lojas ativas na cidade, sem calculo de distancia`
      : locationRadiusSummary;

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermissionState('unsupported');
      setLocationFeedback(
        'Geolocalizacao indisponivel neste navegador. Use o CEP como fallback manual.',
      );
      return;
    }

    setLocationPermissionState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const preview = await previewLocationCoverage({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              coverageRadiusKm: 5,
            });
            setLocationPreview(
              `Preview local: ${preview.activeEstablishmentCount} lojas dentro de ${preview.coverageRadiusKm} km.`,
            );
            await saveBrowserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              coverageRadiusKm: 5,
            });
            setLocationPermissionState('allowed');
            setLocationFeedback(
              'Localizacao salva. Modos locais podem calcular distancia dentro do raio.',
            );
          } catch {
            setLocationPermissionState('denied');
            setLocationFeedback(
              'Nao foi possivel salvar a localizacao. Use o CEP como fallback manual.',
            );
          }
        })();
      },
      () => {
        setLocationPermissionState('denied');
        setLocationFeedback(
          'Permissao negada. O CEP mantem cobertura por cidade sem prometer distancia.',
        );
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
    );
  };

  const savePostalFallback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPostalCode = postalCode.replace(/\D/g, '');
    if (normalizedPostalCode.length !== 8) {
      setLocationFeedback(
        'Informe um CEP com 8 digitos para usar como fallback.',
      );
      return;
    }

    void (async () => {
      try {
        const preview = await previewLocationCoverage({
          postalCode: normalizedPostalCode,
          coverageRadiusKm: 5,
        });
        setLocationPreview(
          `Preview por CEP: ${preview.activeEstablishmentCount} lojas ativas na cidade; sem calculo de distancia.`,
        );
        await savePostalCodeLocation({
          postalCode: normalizedPostalCode,
          coverageRadiusKm: 5,
        });
        setLocationPermissionState('postal_fallback');
        setLocationFeedback(
          'CEP salvo como fallback. A cobertura fica por cidade ate uma localizacao precisa ser liberada.',
        );
      } catch (error: unknown) {
        setLocationFeedback(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel salvar o CEP agora.',
        );
      }
    })();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex flex-wrap items-center gap-5">
            <AppLogo />
            <nav
              aria-label="Navegação principal"
              className="hidden items-center gap-1 md:flex"
            >
              {publicNavItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
              {currentUser?.role === 'admin' ? (
                <NavLink
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                  to="/dashboard"
                >
                  Dashboard
                </NavLink>
              ) : null}
            </nav>
            <div className="hidden items-center gap-3 text-sm text-muted-foreground xl:flex">
              <span>
                {activeLocation ? 'Localização salva' : 'Localização manual'}
              </span>
              <span>·</span>
              <span>raio de 5 km</span>
              {activeCity?.coverageStatus === 'live' ? (
                <span className="rounded-md bg-[var(--ds-savings-soft)] px-2.5 py-1 text-[var(--ds-savings)]">
                  Cobertura ativa
                </span>
              ) : null}
            </div>
          </div>

          <nav
            aria-label="Navegação principal mobile"
            className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:hidden"
          >
            {publicNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            {currentUser?.role === 'admin' ? (
              <NavLink
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
                to="/dashboard"
              >
                Dashboard
              </NavLink>
            ) : null}
          </nav>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              onValueChange={(value) => void setCityId(value)}
              value={cityId ?? ''}
            >
              <SelectTrigger className="w-full sm:w-[320px]">
                <MapPinIcon />
                <SelectValue placeholder="Escolha sua cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name} - {city.activeStoreCount} estabelecimentos
                      ativos
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              aria-label="Configurar localização"
              className="border-border/80 bg-card/90"
              onClick={() => setIsLocationDialogOpen(true)}
              size="icon"
              type="button"
              variant="outline"
            >
              <LocateFixedIcon className="size-4" />
            </Button>

            <Button
              aria-label={
                theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
              }
              className="border-border/80 bg-card/90"
              onClick={toggleTheme}
              size="icon"
              type="button"
              variant="outline"
            >
              {theme === 'dark' ? (
                <SunMediumIcon className="size-4" />
              ) : (
                <MoonStarIcon className="size-4" />
              )}
            </Button>

            {isAuthenticated ? (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/listas">
                    {currentUser?.displayName ?? 'Minha conta'}
                  </Link>
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

      <Dialog
        onOpenChange={setIsLocationDialogOpen}
        open={isLocationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Localização para otimização local</DialogTitle>
            <DialogDescription>
              {locationRadiusDisplay}. Modos locais só calculam distância com
              coordenadas salvas; CEP e modo cidade não prometem proximidade.
            </DialogDescription>
          </DialogHeader>
          <div className="min-w-0">
            {locationFeedback ? (
              <div className="mt-2 rounded-md border border-border/70 bg-card px-2.5 py-1 text-xs text-muted-foreground">
                {locationFeedback}
              </div>
            ) : null}
            {locationPreview ? (
              <div className="mt-2 rounded-md border border-[var(--ds-location-border)] bg-[var(--ds-location-soft)] px-2.5 py-1 text-xs text-[var(--ds-location)]">
                {locationPreview}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-md border border-border/70 bg-card px-2.5 py-1">
              Cidade:{' '}
              {activeCity
                ? `${activeCity.name} · ${activeCity.stateCode}`
                : 'manual pendente'}
            </span>
            <span className="rounded-md border border-border/70 bg-card px-2.5 py-1">
              Permissão:{' '}
              {locationPermissionState === 'allowed'
                ? 'capturada para preview'
                : locationPermissionState === 'denied'
                  ? 'negada'
                  : locationPermissionState === 'unsupported'
                    ? 'indisponível'
                    : locationPermissionState === 'requesting'
                      ? 'solicitando'
                      : locationPermissionState === 'postal_fallback'
                        ? 'CEP fallback'
                        : 'manual'}
            </span>
          </div>
          <DialogFooter className="grid gap-2 sm:grid-cols-[1fr_auto]">
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
            <form className="flex gap-2" onSubmit={savePostalFallback}>
              <Input
                aria-label="CEP para fallback manual"
                className="h-9 min-w-0"
                inputMode="numeric"
                maxLength={9}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="CEP"
                value={postalCode}
              />
              <Button size="sm" type="submit" variant="secondary">
                Salvar CEP
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shouldRequireCitySelection}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Escolha sua cidade para continuar</DialogTitle>
            <DialogDescription>
              A sua cidade fica salva na conta e pode ser trocada depois a
              qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <Select
            onValueChange={(value) => void setCityId(value)}
            value={cityId ?? ''}
          >
            <SelectTrigger>
              <MapPinIcon />
              <SelectValue placeholder="Selecione uma cidade disponível" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} - {city.activeStoreCount} estabelecimentos
                    ativos
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
    </>
  );
}
