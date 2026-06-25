import {
  useEffect,
  useState,
  type FormEvent,
  type PropsWithChildren,
} from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BellIcon,
  Building2Icon,
  EyeIcon,
  EyeOffIcon,
  LifeBuoyIcon,
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
import {
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type NotificationPreferencesResponse,
  type UserNotificationResponse,
} from '@/app/api';
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
import { Switch } from '@/components/ui/switch';
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
import { PricelyBrandMark } from '@/components/design-system/pricely-brand-mark';
import { WithTooltip } from '@/components/design-system/with-tooltip';

const publicNavItems = [
  { label: 'Inicio', to: '/', icon: HomeIcon },
  { label: 'Minha lista', to: '/listas', icon: ListChecksIcon },
  { label: 'Ofertas', to: '/ofertas', icon: SearchIcon },
  { label: 'Lojas', to: '/cidades', icon: Building2Icon },
  { label: 'Cupons', icon: TagsIcon, disabledReason: 'Cupons em breve' },
  { label: 'Notas fiscais', to: '/notas', icon: ReceiptTextIcon },
  {
    label: 'Historico',
    icon: HistoryIcon,
    disabledReason: 'Historico em breve',
  },
  {
    label: 'Configuracoes',
    icon: SettingsIcon,
    disabledReason: 'Configuracoes em breve',
  },
];

function SidebarLogo() {
  return (
    <div className="rounded-lg px-2 py-3">
      <PricelyBrandMark className="group-data-[collapsible=icon]:hidden" />
      <Link
        aria-label="Pricely"
        className="hidden size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex"
        to="/"
      >
        <img
          alt=""
          className="size-7 scale-[2.05] object-contain"
          src={pricelyIcon}
        />
      </Link>
    </div>
  );
}

export function PublicSidebarShell({ children }: PropsWithChildren) {
  const {
    cityId,
    accessToken,
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
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isNotificationsDialogOpen, setIsNotificationsDialogOpen] =
    useState(false);
  const [notifications, setNotifications] = useState<
    UserNotificationResponse[]
  >([]);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferencesResponse | null>(null);
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchNotifications(accessToken).then(setNotifications);
    if (isNotificationsDialogOpen) {
      void fetchNotificationPreferences(accessToken).then(
        setNotificationPreferences,
      );
    }
  }, [accessToken, isNotificationsDialogOpen]);

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
            <div className="rounded-md border border-sidebar-border bg-sidebar-accent/20 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LifeBuoyIcon className="size-4" />
                Precisa de ajuda?
              </div>
              <Button
                className="mt-1 h-auto justify-start p-0 text-sidebar-foreground hover:text-sidebar-accent-foreground"
                onClick={() => setIsHelpDialogOpen(true)}
                size="sm"
                type="button"
                variant="link"
              >
                Central de ajuda
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
                className="relative"
                onClick={() => setIsNotificationsDialogOpen(true)}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <BellIcon className="size-4" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {Math.min(unreadNotifications, 9)}
                  </span>
                ) : null}
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
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Localizacao para otimizacao local</DialogTitle>
            <DialogDescription>
              {locationRadiusDisplay}. Modos locais so calculam distancia com
              coordenadas salvas; CEP e modo cidade nao prometem proximidade. Se
              o navegador bloquear a permissao, libere localizacao nas
              configuracoes do site e tente novamente.
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

      <Dialog
        onOpenChange={setIsNotificationsDialogOpen}
        open={isNotificationsDialogOpen}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notificacoes</DialogTitle>
            <DialogDescription>
              Alertas in-app sobre precos, notas fiscais e otimizacoes.
            </DialogDescription>
          </DialogHeader>
          {!isAuthenticated ? (
            <div className="rounded-lg border border-border/70 bg-card p-4 text-sm">
              Entre na conta para acessar suas notificacoes.
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                {notifications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    Nenhuma notificacao por enquanto.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      className={`grid gap-1 rounded-lg border p-3 text-left ${
                        notification.readAt
                          ? 'border-border/60 bg-card/60'
                          : 'border-primary/30 bg-primary/5'
                      }`}
                      key={notification.id}
                      onClick={async () => {
                        if (!accessToken || notification.readAt) return;
                        const updated = await markNotificationRead(
                          accessToken,
                          notification.id,
                        );
                        setNotifications((current) =>
                          current.map((item) =>
                            item.id === updated.id ? updated : item,
                          ),
                        );
                      }}
                      type="button"
                    >
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString(
                          'pt-BR',
                        )}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {notificationPreferences ? (
                <div className="grid gap-3 rounded-lg border border-border/70 p-4">
                  <div className="font-medium">Preferencias</div>
                  {[
                    ['inAppEnabled', 'Central in-app'],
                    ['priceDropsEnabled', 'Quedas de preco'],
                    ['receiptOutcomesEnabled', 'Resultado de notas'],
                    ['optimizationReadyEnabled', 'Otimizacoes prontas'],
                  ].map(([key, label]) => (
                    <label
                      className="flex items-center justify-between gap-3 text-sm"
                      key={key}
                    >
                      <span>{label}</span>
                      <Switch
                        checked={Boolean(
                          notificationPreferences[
                            key as keyof NotificationPreferencesResponse
                          ],
                        )}
                        onCheckedChange={async (checked) => {
                          if (!accessToken) return;
                          const updated = await updateNotificationPreferences(
                            accessToken,
                            { [key]: checked },
                          );
                          setNotificationPreferences(updated);
                        }}
                      />
                    </label>
                  ))}
                  <div className="text-xs text-muted-foreground">
                    E-mail e push serao adicionados depois; permanecem
                    desativados nesta fase.
                  </div>
                </div>
              ) : null}
            </>
          )}
          <DialogFooter>
            {unreadNotifications > 0 && accessToken ? (
              <Button
                onClick={async () => {
                  await markAllNotificationsRead(accessToken);
                  setNotifications((current) =>
                    current.map((item) => ({
                      ...item,
                      readAt: item.readAt ?? new Date().toISOString(),
                    })),
                  );
                }}
                type="button"
                variant="outline"
              >
                Marcar todas como lidas
              </Button>
            ) : null}
            <Button
              onClick={() => setIsNotificationsDialogOpen(false)}
              type="button"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsHelpDialogOpen} open={isHelpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Central de ajuda</DialogTitle>
            <DialogDescription>
              Encontre orientação rápida para cidade, listas, ofertas, notas
              fiscais e privacidade monetária.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-xl border border-[var(--ds-info-border)] bg-[var(--ds-info-soft)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[var(--ds-info-border)] bg-background">
                <img
                  alt=""
                  className="size-8 scale-[2.05] object-contain"
                  src={pricelyIcon}
                />
              </span>
              <div>
                <div className="font-medium">Roadmap da nota fiscal</div>
                <p className="text-sm text-muted-foreground">
                  A nota enviada vira evidência validada antes de liberar
                  histórico e melhorar ofertas.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {['Enviar', 'Revisar', 'Liberar', 'Recomendar'].map(
                (label, index) => (
                  <div className="grid gap-1" key={label}>
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      {index < 3 ? (
                        <span className="hidden h-px flex-1 bg-border sm:block" />
                      ) : null}
                    </div>
                    <div className="text-xs font-medium">{label}</div>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            {[
              {
                title: 'Cidade e localização',
                copy: 'A cidade fica no header. A localização precisa só é usada quando você autoriza ou salva um CEP.',
              },
              {
                title: 'Listas e ofertas',
                copy: 'Monte uma lista para comparar produtos equivalentes e ver a melhor estratégia por loja.',
              },
              {
                title: 'Notas fiscais',
                copy: 'Envie a nota para validar preços reais, aumentar confiança dos dados e liberar histórico na conta.',
              },
            ].map((item) => (
              <div
                className="rounded-lg border border-border/70 bg-card p-3"
                key={item.title}
              >
                <div className="font-medium">{item.title}</div>
                <p className="mt-1 text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpDialogOpen(false)} type="button">
              Entendi
            </Button>
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
          <p className="text-sm text-muted-foreground">
            A selecao salva automaticamente e libera as telas com contexto da
            cidade.
          </p>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
