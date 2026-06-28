import { useState } from 'react';
import { MapPinIcon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PageHead } from '@/components/shopper/section';
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
  const [priv, setPriv] = useState(false);
  const [push, setPush] = useState(true);
  const [price, setPrice] = useState(true);
  const [emails, setEmails] = useState(false);

  return (
    <div>
      <PageHead title="Configurações" subtitle="Conta, localização, privacidade e notificações" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Perfil">
          <div className="flex items-center gap-3.5">
            <Avatar className="size-14">
              <AvatarFallback className="bg-[var(--ds-primary-soft)] text-lg font-bold text-primary">U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-[16px] font-bold">Usuário</div>
              <div className="text-[13px] text-muted-foreground">usuario@email.com</div>
            </div>
            <Button variant="outline">Editar</Button>
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
          <Row label="Usar localização salva" desc="Resultados priorizam lojas perto de você" top>
            <Switch defaultChecked onCheckedChange={() => toast.info('Localização mantida')} />
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
          <Row label="Notificações push" desc="Status de otimização e notas">
            <Switch checked={push} onCheckedChange={setPush} />
          </Row>
          <Row label="Alertas de preço" desc="Quando um item da lista baixar de preço" top>
            <Switch checked={price} onCheckedChange={setPrice} />
          </Row>
          <Row label="E-mails de novidades" top>
            <Switch checked={emails} onCheckedChange={setEmails} />
          </Row>
        </Section>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={() => toast.success('Configurações salvas')} className="bg-[#134e48] hover:bg-[#0f3f3a]">
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
