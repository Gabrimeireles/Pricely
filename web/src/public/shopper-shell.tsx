import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CheckCheck,
  ChevronDownIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  HomeIcon,
  ListChecksIcon,
  MapPinIcon,
  ReceiptTextIcon,
  SettingsIcon,
  SparklesIcon,
  StoreIcon,
  TagsIcon,
  ZapIcon,
} from 'lucide-react';
import { Toaster } from 'sonner';

import pricelyIcon from '@/assets/pricely-icon.png';
import { StatusBadge } from '@/components/design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CITIES, type City } from '@/app/shopper-data';
import {
  fetchNotifications,
  markAllNotificationsRead,
  type UserNotificationResponse,
} from '@/app/api';
import { usePricely } from '@/app/pricely-context';

import { CityDialog, CoverageDialog, RadiusSelect } from '@/components/shopper/location-controls';

type LocationCtx = {
  city: City;
  radius: number;
  setCity: (c: City) => void;
  setRadius: (km: number) => void;
  openCity: () => void;
  openCoverage: () => void;
};
const Ctx = createContext<LocationCtx | null>(null);
export function useLocationCtx() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLocationCtx must be used within ShopperShell');
  return v;
}

const NAV = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/listas', label: 'Minha lista', icon: ListChecksIcon },
  { to: '/ofertas', label: 'Ofertas', icon: TagsIcon },
  { to: '/lojas', label: 'Lojas', icon: StoreIcon },
  { to: '/cupons', label: 'Cupons', icon: CoinsIcon },
  { to: '/notas', label: 'Notas fiscais', icon: ReceiptTextIcon },
  { to: '/historico', label: 'Histórico', icon: ClockIcon },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

function SidebarFooter() {
  const { profile, isAuthenticated } = usePricely();
  const isPremium = isAuthenticated && profile.entitlementPlan === 'premium';

  if (isPremium) {
    return (
      <div data-slot="sidebar-footer" className="mt-auto rounded-2xl border border-[var(--ds-primary-soft)] bg-[var(--ds-primary-soft)]/40 p-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <span className="font-heading text-[14px] font-bold text-primary">Pricely Plus ativo</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <ZapIcon className="size-3.5 text-primary" />
          <span>{profile.availableOptimizationTokens} token{profile.availableOptimizationTokens !== 1 ? 's' : ''} disponíve{profile.availableOptimizationTokens !== 1 ? 'is' : 'l'}</span>
        </div>
      </div>
    );
  }

  return (
    <div data-slot="sidebar-footer" className="mt-auto rounded-2xl bg-brand-band p-4 text-white">
      <div className="font-heading text-[15px] font-bold">Pricely Plus</div>
      <p className="mt-0.5 text-[12.5px] opacity-85">Mais cidades, alertas de preço e histórico estendido.</p>
      <Button className="mt-3 w-full bg-white font-bold text-primary hover:bg-white/90">Conhecer</Button>
    </div>
  );
}

function Sidebar() {
  return (
    <aside data-slot="sidebar" className="hidden w-[236px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-card p-3.5 lg:flex">
      <div data-slot="sidebar-header" className="px-2 pb-4 pt-1">
        <img src={pricelyIcon} alt="Pricely" className="h-7" />
      </div>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          data-sidebar="menu-button"
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-colors',
              isActive
                ? 'bg-[var(--ds-primary-soft)] font-semibold text-primary before:absolute before:-left-3.5 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded before:bg-primary'
                : 'text-foreground hover:bg-muted',
            )
          }
        >
          <n.icon className="size-[19px]" />
          <span>{n.label}</span>
        </NavLink>
      ))}
      <SidebarFooter />
    </aside>
  );
}

function NotificationBell({ accessToken }: { accessToken: string | null }) {
  const [notifications, setNotifications] = useState<UserNotificationResponse[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchNotifications(accessToken).then(setNotifications).catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const unread = notifications.filter((n) => !n.readAt).length;

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0 && accessToken) {
      markAllNotificationsRead(accessToken)
        .then(() => setNotifications((ns) => ns.map((n) => ({ ...n, readAt: new Date().toISOString() }))))
        .catch(() => {});
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button variant="ghost" size="icon" aria-label="Notificações" className="relative" onClick={handleOpen}>
        <BellIcon className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full border-2 border-card bg-[var(--ds-critical)] text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading text-[14px] font-bold">Notificações</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (accessToken) {
                    markAllNotificationsRead(accessToken)
                      .then(() => setNotifications((ns) => ns.map((n) => ({ ...n, readAt: new Date().toISOString() }))))
                      .catch(() => {});
                  }
                }}
                className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="size-3.5" /> Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Nenhuma notificação ainda.
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'border-b border-border px-4 py-3 last:border-0',
                    !n.readAt && 'bg-[var(--ds-primary-soft)]/40',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className={cn('min-w-0', n.readAt && 'pl-3.5')}>
                      <div className="text-[13px] font-semibold">{n.title}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{n.message}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Topbar() {
  const navigate = useNavigate();
  const { city, radius, setRadius, openCity } = useLocationCtx();
  const { signOut, currentUser, isAuthenticated, accessToken } = usePricely();

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  function handleSignOut() {
    signOut();
    navigate('/entrar');
  }

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3.5 border-b border-border bg-card px-7 py-3">
      <Button variant="outline" onClick={openCity} className="h-[42px] gap-2 rounded-xl text-[15px] font-semibold">
        <MapPinIcon className="size-[17px] text-primary" /> {city.name}
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </Button>
      <div className="hidden md:block">
        <RadiusSelect radius={radius} onChange={setRadius} />
      </div>
      <span className="hidden text-sm text-muted-foreground md:inline">Localização salva</span>
      <StatusBadge tone="savings" icon={CheckCircle2Icon} label="Cobertura ativa" />

      <div className="ml-auto flex items-center gap-3">
        {isAuthenticated && <NotificationBell accessToken={accessToken} />}
        {isAuthenticated ? (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              <AvatarImage src="" alt={currentUser?.displayName ?? 'Usuário'} />
              <AvatarFallback className="bg-[var(--ds-primary-soft)] text-primary">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
              Sair
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/entrar')}>
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
}

const PROTECTED_PREFIXES = ['/listas', '/notas', '/historico', '/configuracoes'];

function regionToCity(r: { id: string; name: string; stateCode: string; activeStoreCount: number }): City {
  return {
    id: r.id,
    name: `${r.name} · ${r.stateCode}`,
    stores: r.activeStoreCount,
    status: 'active',
    district: 'Centro',
  };
}

export function ShopperShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    isBootstrapping,
    cityId,
    cities,
    locationPreferences,
    saveBrowserLocation,
    savePostalCodeLocation,
    setCityId,
  } = usePricely();

  useEffect(() => {
    if (isBootstrapping) return;
    const isProtected = PROTECTED_PREFIXES.some((p) => location.pathname.startsWith(p));
    if (!isAuthenticated && isProtected) {
      navigate('/entrar', { replace: true });
    }
  }, [isAuthenticated, isBootstrapping, location.pathname, navigate]);

  const activeRegion = cities.find((c) => c.id === (cityId ?? cities[0]?.id)) ?? cities[0];
  const defaultCity = activeRegion ? regionToCity(activeRegion) : CITIES[0];
  const [city, setCity] = useState<City>(defaultCity);
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    if (activeRegion) setCity(regionToCity(activeRegion));
  }, [activeRegion?.id, activeRegion?.activeStoreCount]);

  const activeLocation = locationPreferences.find(
    (p) => p.isDefault && p.regionSlug === cityId,
  ) ?? null;

  useEffect(() => {
    if (activeLocation?.coverageRadiusKm) setRadius(activeLocation.coverageRadiusKm);
  }, [activeLocation?.coverageRadiusKm]);

  const [cityOpen, setCityOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  // Prompt for city if none is set
  useEffect(() => {
    if (!isBootstrapping && isAuthenticated && !cityId && cities.length > 0) {
      setCityOpen(true);
    }
  }, [isBootstrapping, isAuthenticated, cityId, cities.length]);

  // Prompt for location permission once per city (when no preference exists)
  useEffect(() => {
    if (!isBootstrapping && isAuthenticated && cityId && !activeLocation) {
      setLocationPromptOpen(true);
    }
  }, [isBootstrapping, isAuthenticated, cityId, activeLocation]);

  const handleCityPick = (c: City) => {
    setCity(c);
    void setCityId(c.id);
  };

  const handleRadiusChange = (km: number) => {
    setRadius(km);
    if (!activeLocation) return;
    if (activeLocation.locationSource === 'browser_geolocation' &&
        activeLocation.latitude && activeLocation.longitude) {
      void saveBrowserLocation({ latitude: activeLocation.latitude, longitude: activeLocation.longitude, coverageRadiusKm: km });
    } else if (activeLocation.locationSource === 'postal_code_fallback' && activeLocation.postalCode) {
      void savePostalCodeLocation({ postalCode: activeLocation.postalCode, coverageRadiusKm: km });
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationPromptOpen(false);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void saveBrowserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          coverageRadiusKm: radius,
        }).finally(() => {
          setLocating(false);
          setLocationPromptOpen(false);
        });
      },
      () => {
        setLocating(false);
        setLocationPromptOpen(false);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 },
    );
  };

  const cityItems = cities.map(regionToCity);

  const ctx = useMemo<LocationCtx>(
    () => ({
      city,
      radius,
      setCity: handleCityPick,
      setRadius: handleRadiusChange,
      openCity: () => setCityOpen(true),
      openCoverage: () => setCoverageOpen(true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city, radius],
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1280px] px-7 py-6 pb-14">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <Dialog open={locationPromptOpen} onOpenChange={setLocationPromptOpen}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-[var(--ds-primary-soft)]">
              <MapPinIcon className="size-6 text-primary" />
            </div>
            <DialogTitle className="font-heading text-lg">Encontrar lojas próximas</DialogTitle>
            <DialogDescription>
              Compartilhe sua localização para ver preços e lojas no seu raio.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            <Button onClick={requestBrowserLocation} disabled={locating} className="w-full">
              {locating ? 'Detectando…' : 'Usar minha localização'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => { setLocationPromptOpen(false); setCityOpen(true); }}
            >
              Escolher cidade manualmente
            </Button>
            <button
              type="button"
              onClick={() => setLocationPromptOpen(false)}
              className="text-[13px] text-muted-foreground hover:text-foreground"
            >
              Agora não
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CityDialog open={cityOpen} onOpenChange={setCityOpen} current={city} onPick={handleCityPick} items={cityItems} />
      <CoverageDialog open={coverageOpen} onOpenChange={setCoverageOpen} city={city} radius={radius} />
      <Toaster position="bottom-right" richColors />
    </Ctx.Provider>
  );
}
