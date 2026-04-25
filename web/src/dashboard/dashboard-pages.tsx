import { Link } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  Clock3Icon,
  DatabaseZapIcon,
  Layers3Icon,
  ReceiptTextIcon,
} from 'lucide-react';

import { formatCurrency, formatDateTime, formatFreshnessLabel } from '@/app/format';
import {
  adminMetrics,
  adminQueueIssues,
  initialShoppingLists,
  optimizationModes,
  regionalOffers,
} from '@/app/mock-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Visão geral operacional</h1>
        <p className="text-muted-foreground">
          Tudo aqui precisa ser rastreável: origem do preço, estado da fila, cobertura de
          lista e itens normalizados.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {adminMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle>{metric.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{metric.support}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Saúde das decisões exibidas</CardTitle>
            <CardDescription>
              O dashboard prioriza leitura rápida sem perder ligação com o objeto de origem.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2Icon className="text-lime-700" />
                Confiança alta
              </div>
              <div className="mt-3 text-2xl font-semibold">74%</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3Icon className="text-amber-600" />
                Dado envelhecendo
              </div>
              <div className="mt-3 text-2xl font-semibold">19%</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangleIcon className="text-rose-600" />
                Revisão urgente
              </div>
              <div className="mt-3 text-2xl font-semibold">7%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos de operação</CardTitle>
            <CardDescription>Fluxos mais usados pela equipe no dia.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="justify-between" variant="outline">
              <Link to="/dashboard/precos">
                Revisar ofertas antigas
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild className="justify-between" variant="outline">
              <Link to="/dashboard/catalogo">
                Sanitizar produtos pendentes
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild className="justify-between" variant="outline">
              <Link to="/dashboard/fila">
                Abrir fila de processamento
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminPricesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preços e ofertas</CardTitle>
        <CardDescription>
          Visão densa para comparar item, loja, confiança, frescor e fonte de evidência.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Atualização</TableHead>
              <TableHead>Confiança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regionalOffers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{offer.productName}</span>
                    <span className="text-xs text-muted-foreground">{offer.packageLabel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{offer.storeName}</span>
                    <span className="text-xs text-muted-foreground">{offer.neighborhood}</span>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(offer.price)}</TableCell>
                <TableCell>{offer.evidence[0]?.sourceLabel}</TableCell>
                <TableCell>{formatFreshnessLabel(offer.updatedAt)}</TableCell>
                <TableCell>
                  <Badge variant={offer.confidence === 'alta' ? 'secondary' : offer.confidence === 'media' ? 'outline' : 'destructive'}>
                    {offer.confidence}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AdminCatalogPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Itens normalizados</CardTitle>
          <CardDescription>
            Catálogo com aliases, vínculo de oferta e evidência mais recente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            {
              canonical: 'cafe tradicional',
              aliases: ['CAF 3C TRAD 500', 'CAFÉ 3 CORAÇÕES 500G'],
              status: 'revisão média',
            },
            {
              canonical: 'banana nanica',
              aliases: ['banana nanica kg', 'banana madura kg'],
              status: 'alta confiança',
            },
          ].map((item) => (
            <div key={item.canonical} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item.canonical}</span>
                <Badge variant={item.status === 'alta confiança' ? 'secondary' : 'outline'}>
                  {item.status}
                </Badge>
              </div>
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-2">
                {item.aliases.map((alias) => (
                  <Badge key={alias} variant="outline">
                    {alias}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fila de sanitização</CardTitle>
          <CardDescription>
            Registros com baixa confiança aparecem antes para revisão humana.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {adminQueueIssues.map((issue) => (
            <Alert key={issue.id} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
              {issue.severity === 'critical' ? <AlertTriangleIcon /> : <CircleDashedIcon />}
              <AlertTitle>{issue.stage}</AlertTitle>
              <AlertDescription>{issue.message}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminListsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Listas e otimizações</CardTitle>
        <CardDescription>
          Comparação entre modo escolhido, cobertura entregue e economia estimada.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lista</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Economia estimada</TableHead>
              <TableHead>Atualização</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialShoppingLists.map((list) => (
              <TableRow key={list.id}>
                <TableCell>{list.name}</TableCell>
                <TableCell>{list.cityId}</TableCell>
                <TableCell>
                  {optimizationModes.find((mode) => mode.id === list.lastMode)?.label}
                </TableCell>
                <TableCell>{list.items.length}</TableCell>
                <TableCell>{formatCurrency(list.expectedSavings)}</TableCell>
                <TableCell>{formatDateTime(list.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AdminQueuePage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Fila de processamento</CardTitle>
          <CardDescription>
            Status recente de OCR, parsing, normalização e publicação de oferta.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            {
              label: 'OCR de notas',
              value: '13 aguardando',
              icon: ReceiptTextIcon,
            },
            {
              label: 'Normalização',
              value: '6 em revisão',
              icon: Layers3Icon,
            },
            {
              label: 'Publicação de ofertas',
              value: '22 prontas para atualizar',
              icon: DatabaseZapIcon,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/70 p-4">
              <div className="flex items-center gap-3">
                <item.icon className="text-primary" />
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erros recentes</CardTitle>
          <CardDescription>
            Eventos com carimbo de data e intensidade para priorização da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {adminQueueIssues.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{issue.stage}</span>
                <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {issue.severity}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{issue.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(issue.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
