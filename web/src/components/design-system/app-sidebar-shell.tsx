import { useState, type FormEvent, type PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BellIcon,
  Building2Icon,
  EyeIcon,
  EyeOffIcon,
  HistoryIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  LocateFixedIcon,
  MapPinIcon,
  MoonStarIcon,
  ReceiptTextIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SunMediumIcon,
  TagsIcon,
  UserIcon,
} from 'lucide-react';

import { useMonetaryPrivacy } from '@/app/monetary-privacy-context';
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
import { WithTooltip } from '@/components/design-system/with-tooltip';

const publicNavItems = [
  { label: 'Inicio', to: '/', icon: HomeIcon },
  { label: 'Minha lista', to: '/listas', icon: ListChecksIcon },
  { label: 'Ofertas', to: '/ofertas', icon: SearchIcon },
  { label: 'Lojas', to: '/cidades', icon: Building2Icon },
  { label: 'Cupons', icon: TagsIcon, disabledReason: 'Cupons em breve' },
  { label: 'Notas fiscais', to: '/notas', icon: ReceiptTextIcon },
  { label: 'Historico', icon: HistoryIcon, disabledReason: 'Historico em breve' },
  {
    label: 'Configuracoes',
    icon: SettingsIcon,
    disabledReason: 'Configuracoes em breve',
  },
];

function SidebarLogo() {
  return (
    <Link className="flex items-center gap-2.5 rounded-lg px-2 py-2" to="/">
      <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <img
          alt=""
          className="size-7 rounded-md object-cover"
          src={pricelyIcon}
        />
      </div>
      <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
        <span className="font-heading text-base font-semibold tracking-tight">
          pricely
        </span>
        <span className="text-xs text-sidebar-foreground/70">
          economia com contexto real
        </span>
      </div>
    </Link>
  );
}

export function PublicSidebarShell({ children }: PropsWithChildren) {
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
  const { isMoneyVisible, toggleMoneyVisibility } = useMonetaryPrivacy();
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
  const activeLocationHasCoordinates =
    activeLocation?.latitude !== null &&
    activeLocation?.latitude !== undefined &&
    activeLocation?.longitude !== null &&
    activeLocation?.longitude !== undefined;
  const locationRadiusDisplay =
    activeCity && activeLocation
      ? activeLocationHasCoordinates
        ? `${activeLocation.activeEstablishmentCount} lojas dentro de ${activeLocation.coverageRadiusKm} km`
        : `CEP ${activeLocation.postalCode ?? 'salvo'} como fallback: ${activeLocation.activeEstablishmentCount} lojas ativas na cidade, sem calculo de distancia`
      : activeCity
        ? `${activeCity.activeStoreCount} lojas na cidade - raio local padrao 5 km aguardando localizacao`
        : 'Raio local padrao 5 km disponivel apos escolher a cidade';

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
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="shrink-0">
          <SidebarLogo />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu aria-label="Navegacao principal">
                {publicNavItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    {item.to ? (
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          className={({ isActive }) =>
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : ''
                          }
                          end={item.to === '/'}
                          to={item.to}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        aria-disabled="true"
                        className="opacity-55"
                        disabled
                        tooltip={item.disabledReason}
                        type="button"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
                {currentUser?.role === 'admin' ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <NavLink
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : ''
                        }
                        to="/dashboard"
                      >
                        <LayoutDashboardIcon />
                        <span>Dashboard</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="shrink-0">
          <div className="grid gap-2 rounded-lg border border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {activeCity ? activeCity.name : 'Cidade pendente'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {activeCity
                  ? `${activeCity.activeStoreCount} lojas ativas`
                  : 'Escolha no header'}
              </p>
            </div>
            <div className="flex gap-2">
              <WithTooltip
                label={
                  isMoneyVisible
                    ? 'Oculta valores monetários sensíveis em cards, listas e otimizações.'
                    : 'Mostra novamente valores monetários em cards, listas e otimizações.'
                }
              >
                <Button
                  aria-label={
                    isMoneyVisible
                      ? 'Ocultar valores monetários'
                      : 'Mostrar valores monetários'
                  }
                  onClick={toggleMoneyVisibility}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  className="border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {isMoneyVisible ? (
                    <EyeIcon className="size-4" />
                  ) : (
                    <EyeOffIcon className="size-4" />
                  )}
                </Button>
              </WithTooltip>
              <WithTooltip label="Alterna entre tema claro e escuro.">
                <Button
                  aria-label={
                    theme === 'dark'
                      ? 'Ativar modo claro'
                      : 'Ativar modo escuro'
                  }
                  onClick={toggleTheme}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  className="border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {theme === 'dark' ? (
                    <SunMediumIcon className="size-4" />
                  ) : (
                    <MoonStarIcon className="size-4" />
                  )}
                </Button>
              </WithTooltip>
              <Button
                className="flex-1 border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => setIsLocationDialogOpen(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                <LocateFixedIcon data-icon="inline-start" />
                Local
              </Button>
            </div>
          </div>
          <WithTooltip
            label={
              isMoneyVisible
                ? 'Oculta valores monetários sensíveis em cards, listas e otimizações.'
                : 'Mostra novamente valores monetários em cards, listas e otimizações.'
            }
          >
            <Button
              aria-label={
                isMoneyVisible
                  ? 'Ocultar valores monetários'
                  : 'Mostrar valores monetários'
              }
              onClick={toggleMoneyVisibility}
              size="icon-sm"
              type="button"
              variant="outline"
              className="hidden border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:inline-flex"
            >
              {isMoneyVisible ? (
                <EyeIcon className="size-4" />
              ) : (
                <EyeOffIcon className="size-4" />
              )}
            </Button>
          </WithTooltip>
          <WithTooltip label="Alterna entre tema claro e escuro.">
            <Button
              aria-label={
                theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
              }
              className="hidden border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:inline-flex"
              onClick={toggleTheme}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              {theme === 'dark' ? (
                <SunMediumIcon className="size-4" />
              ) : (
                <MoonStarIcon className="size-4" />
              )}
            </Button>
          </WithTooltip>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/94 px-4 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {activeCity
                  ? `${activeCity.name} - ${activeCity.activeStoreCount} estabelecimentos ativos`
                  : 'Escolha sua cidade'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {activeLocation ? 'Localizacao salva' : 'Localizacao manual'} -
                raio de 5 km
              </p>
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <Select
              onValueChange={(value) => void setCityId(value)}
              value={cityId ?? ''}
            >
              <SelectTrigger className="hidden h-9 w-[260px] bg-background md:inline-flex">
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
            <WithTooltip label="Configure cidade, CEP ou localização precisa para calcular cobertura local.">
              <Button
                aria-label="Configurar localização"
                onClick={() => setIsLocationDialogOpen(true)}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <LocateFixedIcon className="size-4" />
              </Button>
            </WithTooltip>
            <WithTooltip label="Notificações de preço, cobertura e revisão aparecerão aqui quando habilitadas.">
              <Button
                aria-label="Notificacoes"
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <BellIcon className="size-4" />
              </Button>
            </WithTooltip>
            {isAuthenticated ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link to="/listas">
                    <UserIcon data-icon="inline-start" />
                    <span className="hidden sm:inline">
                      {currentUser?.displayName ?? 'Minha conta'}
                    </span>
                  </Link>
                </Button>
                <Button
                  className="hidden lg:inline-flex"
                  onClick={signOut}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/criar-conta">
                  <ShoppingCartIcon data-icon="inline-start" />
                  Criar conta
                </Link>
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.06),transparent_22%)] px-4 py-6 lg:px-6">
          <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8">
            {children}
          </div>
        </div>
      </SidebarInset>

      <Dialog
        onOpenChange={setIsLocationDialogOpen}
        open={isLocationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Localizacao para otimizacao local</DialogTitle>
            <DialogDescription>
              {locationRadiusDisplay}. Modos locais so calculam distancia com
              coordenadas salvas; CEP e modo cidade nao prometem proximidade.
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
                ? `${activeCity.name} - ${activeCity.stateCode}`
                : 'manual pendente'}
            </span>
            <span className="rounded-md border border-border/70 bg-card px-2.5 py-1">
              Permissao:{' '}
              {locationPermissionState === 'allowed'
                ? 'capturada para preview'
                : locationPermissionState === 'denied'
                  ? 'negada'
                  : locationPermissionState === 'unsupported'
                    ? 'indisponivel'
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
              <SelectValue placeholder="Selecione uma cidade disponivel" />
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
    </SidebarProvider>
  );
}
