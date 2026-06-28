import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CameraIcon,
  ChevronRightIcon,
  Clock3Icon,
  CoinsIcon,
  EyeIcon,
  FileTextIcon,
  ListChecksIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StoreIcon,
} from 'lucide-react';
import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CoverageMap } from '@/components/shopper/coverage-map';
import { OfferCard } from '@/components/shopper/offer-card';
import { SectionTitle } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';
import { OFFERS } from '@/app/shopper-data';

import { useLocationCtx } from './shopper-shell';

export function HomePage() {
  const navigate = useNavigate();
  const { city, radius, openCoverage } = useLocationCtx();

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_322px]">
      <div className="stagger grid gap-5">
        {/* hero */}
        <div className="bg-brand-band relative overflow-hidden rounded-3xl px-7 py-6 text-white">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/[0.06]" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="min-w-60 flex-1">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold opacity-85">
                <SparklesIcon className="size-3.5 text-[var(--ds-savings-border)]" /> Próximo melhor passo
              </div>
              <h1 className="mt-1.5 font-heading text-[27px] font-bold tracking-tight text-balance">
                Continue sua lista e otimize preços
              </h1>
              <p className="mt-1.5 text-[14.5px] opacity-90">
                Sua lista "Compra da semana" está pronta. A última otimização economizou R$ 18,40.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button onClick={() => navigate('/otimizacao/1')} className="h-11 rounded-xl bg-white px-5 font-bold text-primary hover:bg-white/90">
                  Otimizar agora <ArrowRightIcon className="size-4" />
                </Button>
                <Button onClick={() => navigate('/lista')} variant="outline" className="h-11 rounded-xl border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                  Ver minha lista
                </Button>
              </div>
            </div>
            <div className="px-1.5 text-center">
              <div className="text-[12.5px] opacity-80">Economia da semana</div>
              <div className="font-heading text-[40px] font-extrabold leading-tight text-[var(--ds-savings-border)]">R$ 18,40</div>
              <div className="text-[12.5px] opacity-80">↑ 12% vs. média da cidade</div>
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3.5">
          <StatCard icon={<ListChecksIcon />} label="Itens otimizados" value="8 de 12" sub="2 lojas no trajeto" deltaTone="neutral" />
          <StatCard icon={<ShieldCheckIcon />} label="Preços verificados" value="100%" delta="alta" sub="por nota fiscal" />
          <StatCard icon={<StoreIcon />} label="Lojas no raio" value={String(city.stores)} sub={`em ${radius} km`} deltaTone="neutral" />
        </div>

        {/* list + coverage */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ds-neutral-soft)] text-primary"><ListChecksIcon className="size-[19px]" /></span>
              <div className="flex-1">
                <div className="text-[12.5px] text-muted-foreground">Lista ativa</div>
                <div className="font-heading text-[17px] font-bold">Compra da semana</div>
              </div>
              <StatusBadge family="queue" status="running" label="Em andamento" icon={Clock3Icon} tone="savings" />
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--ds-neutral-soft)]"><div className="h-full w-full bg-primary" /></div>
            <div className="mt-1.5 flex justify-between text-[12.5px]"><span className="text-primary">12/12 itens adicionados</span><span className="text-muted-foreground">Pronta para otimizar</span></div>
            <div className="mt-4 flex gap-2.5">
              <Button variant="secondary" onClick={() => navigate('/lista')}>Ver lista</Button>
              <Button variant="ghost" onClick={() => navigate('/lista')}>Editar itens</Button>
            </div>
          </Card>

          <Card className="rounded-2xl p-5">
            <div className="mb-3.5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ds-location-soft)] text-[var(--ds-location)]"><MapPinIcon className="size-[19px]" /></span>
              <div className="flex-1">
                <div className="text-[12.5px] text-muted-foreground">Cobertura local</div>
                <div className="font-heading text-[17px] font-bold">{city.stores} lojas no raio</div>
              </div>
              <StatusBadge tone="location">Raio {radius} km</StatusBadge>
            </div>
            <CoverageMap height={150} radiusKm={radius} stores={city.stores} interactive={false} />
            <Button variant="outline" onClick={openCoverage} className="mt-3 w-full rounded-xl text-primary">
              <MapPinIcon className="size-[15px]" /> Ver mapa completo
            </Button>
          </Card>
        </div>

        {/* offers */}
        <div>
          <SectionTitle action="Ver todas as ofertas" onAction={() => navigate('/ofertas')}>Ofertas recomendadas para você</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {OFFERS.slice(0, 4).map((o) => <OfferCard key={o.id} offer={o} onClick={() => navigate('/ofertas')} />)}
          </div>
        </div>
      </div>

      {/* right rail */}
      <div className="stagger sticky top-[86px] grid gap-4">
        <Card className="rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ds-warning-soft)] text-[var(--ds-warning)]"><FileTextIcon className="size-[19px]" /></span>
            <div className="flex-1"><div className="text-[12.5px] text-muted-foreground">Nota fiscal</div><div className="text-[15px] font-bold">Em revisão</div></div>
            <StatusBadge family="receipt" status="pending_review" label="Aguardando" />
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">Enviada em 12/05 às 09:32 · R$ 245,37. Avisaremos quando for liberada.</p>
          <Button variant="outline" onClick={() => navigate('/notas-fiscais')} className="mt-3.5 w-full rounded-xl"><EyeIcon className="size-[15px]" /> Acompanhar</Button>
        </Card>

        <Card className="rounded-2xl p-5">
          <div className="mb-3 font-heading text-[15px] font-bold">Ações rápidas</div>
          <div className="grid gap-2">
            {([
              [SparklesIcon, 'Otimizar lista', '/otimizacao/1'],
              [CameraIcon, 'Enviar nota fiscal', '/notas-fiscais'],
              [StoreIcon, 'Explorar lojas', '/lojas'],
              [CoinsIcon, 'Ver cupons', '/cupons'],
            ] as const).map(([Icon, label, to]) => (
              <button key={label} onClick={() => navigate(to)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 px-3 text-left hover:bg-muted">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-neutral-soft)] text-primary"><Icon className="size-4" /></span>
                <span className="flex-1 text-[13.5px] font-semibold">{label}</span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
