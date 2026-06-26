import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { AlertTriangleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function RouteErrorPage() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);
  const status = isRouteError ? error.status : error ? 500 : 404;
  const title =
    status === 404
      ? 'Pagina nao encontrada'
      : 'Nao foi possivel abrir esta pagina';
  const description =
    status === 404
      ? 'O endereco informado nao existe nesta versao do Pricely.'
      : 'Tente voltar para uma area conhecida do app.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="grid w-full max-w-xl gap-5 rounded-lg border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Erro {status}</div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/">Ir para o inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Abrir dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
