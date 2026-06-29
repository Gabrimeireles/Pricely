import { useEffect, useState } from 'react';
import { MapPinIcon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PageHead } from '@/components/shopper/section';
import { fetchNotificationPreferences, updateNotificationPreferences } from '@/app/api';
import { usePricely } from '@/app/pricely-context';
import { useLocationCtx } from './shopper-shell';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-3.5 font-heading text-[16px] font-bold">{title}</div>
      {children}
    </Card>
  );
}

function Row({
  label,
  desc,
  top,
  children,
}: {
  label: string;
  desc?: string;
  top?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3.5 py-3 ${top ? 'border-t border-border' : ''}`}>
      <div className="flex-1">
        <div className="text-[14px] font-semibold">{label}</div>
        {desc ? <div className="text-[12.5px] text-muted-foreground">{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { city, openCity, openCoverage } = useLocationCtx();
  const { currentUser, accessToken } = usePricely();

  const [priv, setPriv] = useState(false);
  const [push, setPush] = useState(false);
  const [price, setPrice] = useState(false);
  const [receipts, setReceipts] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchNotificationPreferences(accessToken)
      .then((p) => {
        setPush(p.inAppEnabled);
        setPrice(p.priceDropsEnabled);
        setReceipts(p.receiptOutcomesEnabled);
        setPrefsLoaded(true);
      })
      .catch(() => setPrefsLoaded(true));
  }, [accessToken]);

  async function savePrefs() {
    if (!accessToken) return;
    try {
      await updateNotificationPreferences(accessToken, {
        inAppEnabled: push,
        priceDropsEnabled: price,
        receiptOutcomesEnabled: receipts,
      });
      toast.success('Configurações salvas');
    } catch {
      toast.error('Erro ao salvar configurações');
    }
  }

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div>
      <PageHead title="Configurações" subtitle="Conta, localização, privacidade e notificações" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Perfil">
          <div className="flex items-center gap-3.5">
            <Avatar className="size-14">
              <AvatarFallback className="bg-[var(--ds-primary-soft)] text-lg font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-[16px] font-bold">{currentUser?.displayName ?? 'Usuário'}</div>
              <div className="text-[13px] text-muted-foreground">{currentUser?.email ?? ''}</div>
            </div>
          </div>
          <div className="mt-3.5">
            <StatusBadge tone="primary" icon={ShieldCheckIcon}>Conta verificada</StatusBadge>
          </div>
        </Section>

        <Section title="Localização">
          <Row label="Cidade ativa" desc={city.name}>
            <Button variant="outline" onClick={openCity}>Trocar</Button>
          </Row>
          <Row label="Raio de busca" desc="Ver mapa de cobertura" top>
            <Button variant="outline" onClick={openCoverage}>
              <MapPinIcon className="size-[15px]" /> Mapa
            </Button>
          </Row>
        </Section>

        <Section title="Privacidade">
          <Row label="Ocultar valores" desc="Esconde preços e totais na tela">
            <Switch
              checked={priv}
              onCheckedChange={(v) => {
                setPriv(v);
                toast.info(v ? 'Valores ocultos' : 'Valores visíveis');
              }}
            />
          </Row>
          <Row label="Dados de compra" desc="Usados só para melhorar suas ofertas" top>
            <StatusBadge tone="savings" icon={ShieldCheckIcon}>Protegidos</StatusBadge>
          </Row>
        </Section>

        <Section title="Notificações">
          <Row label="Notificações in-app" desc="Status de otimização e notas">
            <Switch checked={push} onCheckedChange={setPush} disabled={!prefsLoaded} />
          </Row>
          <Row label="Alertas de preço" desc="Quando um item da lista baixar de preço" top>
            <Switch checked={price} onCheckedChange={setPrice} disabled={!prefsLoaded} />
          </Row>
          <Row label="Resultado de notas fiscais" desc="Quando uma nota for processada" top>
            <Switch checked={receipts} onCheckedChange={setReceipts} disabled={!prefsLoaded} />
          </Row>
        </Section>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={savePrefs} className="bg-[#134e48] hover:bg-[#0f3f3a]">
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
