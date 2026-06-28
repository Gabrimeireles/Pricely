import { createContext, useContext, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BellIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  HomeIcon,
  ListChecksIcon,
  MapPinIcon,
  ReceiptTextIcon,
  SettingsIcon,
  StoreIcon,
  TagsIcon,
} from 'lucide-react';
import { Toaster } from 'sonner';

import pricelyIcon from '@/assets/pricely-icon.png';
import { StatusBadge } from '@/components/design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CITIES, type City } from '@/app/shopper-data';

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
  { to: '/lista', label: 'Minha lista', icon: ListChecksIcon },
  { to: '/ofertas', label: 'Ofertas', icon: TagsIcon },
  { to: '/lojas', label: 'Lojas', icon: StoreIcon },
  { to: '/cupons', label: 'Cupons', icon: CoinsIcon },
  { to: '/notas-fiscais', label: 'Notas fiscais', icon: ReceiptTextIcon },
  { to: '/historico', label: 'Histórico', icon: ClockIcon },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

function Sidebar() {
  return (
    <aside data-slot="sidebar" className="hidden w-[236px] shrink-0 flex-col gap-1 border-r border-border bg-card p-3.5 lg:flex">
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
      <div data-slot="sidebar-footer" className="mt-auto rounded-2xl bg-brand-band p-4 text-white">
        <div className="font-heading text-[15px] font-bold">Pricely Plus</div>
        <p className="mt-0.5 text-[12.5px] opacity-85">Mais cidades, alertas de preço e histórico estendido.</p>
        <Button className="mt-3 w-full bg-white font-bold text-primary hover:bg-white/90">Conhecer</Button>
      </div>
    </aside>
  );
}

function Topbar() {
  const { city, radius, setRadius, openCity } = useLocationCtx();
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
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
          <BellIcon className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-card bg-[var(--ds-critical)]" />
        </Button>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarImage src="" alt="Usuário" />
            <AvatarFallback className="bg-[var(--ds-primary-soft)] text-primary">U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export function ShopperShell() {
  const [city, setCity] = useState<City>(CITIES[0]);
  const [radius, setRadius] = useState(5);
  const [cityOpen, setCityOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);

  const ctx = useMemo<LocationCtx>(
    () => ({
      city,
      radius,
      setCity,
      setRadius,
      openCity: () => setCityOpen(true),
      openCoverage: () => setCoverageOpen(true),
    }),
    [city, radius],
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1280px] px-7 py-6 pb-14">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <CityDialog open={cityOpen} onOpenChange={setCityOpen} current={city} onPick={setCity} />
      <CoverageDialog open={coverageOpen} onOpenChange={setCoverageOpen} city={city} radius={radius} />
      <Toaster position="bottom-right" richColors />
    </Ctx.Provider>
  );
}
