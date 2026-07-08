import { PublicLayout } from '@/public/public-shell';
import {
  ChecklistPage,
  CitiesPage,
  LandingPage,
  ListsPage,
  OfferDetailPage,
  OffersPage,
  OptimizationPage,
  ReceiptSubmissionPage,
  SharedListPage,
  SignInPage,
  SignUpPage,
} from '@/public/public-pages';
import { ListEditorPage } from '@/public/list-editor-page';
import { RouteErrorPage } from './route-error';

export const publicRoute = {
  path: '/',
  element: <PublicLayout />,
  errorElement: <RouteErrorPage />,
  children: [
    {
      index: true,
      element: <LandingPage />,
    },
    {
      path: 'ofertas',
      element: <OffersPage />,
    },
    {
      path: 'ofertas/:offerId',
      element: <OfferDetailPage />,
    },
    {
      path: 'cidades',
      element: <CitiesPage />,
    },
    {
      path: 'entrar',
      element: <SignInPage />,
    },
    {
      path: 'criar-conta',
      element: <SignUpPage />,
    },
    {
      path: 'listas',
      element: <ListsPage />,
    },
    {
      path: 'notas',
      element: <ReceiptSubmissionPage />,
    },
    {
      path: 'listas/:listId',
      element: <ListEditorPage />,
    },
    {
      path: 'compartilhar/listas/:shareToken',
      element: <SharedListPage />,
    },
    {
      path: 'listas/:listId/checklist',
      element: <ChecklistPage />,
    },
    {
      path: 'otimizacao/:listId',
      element: <OptimizationPage />,
    },
    {
      path: '*',
      element: <RouteErrorPage />,
    },
  ],
};
