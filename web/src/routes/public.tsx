import { PublicLayout } from '@/public/public-shell';
import {
  ChecklistPage,
  CitiesPage,
  LandingPage,
  ListEditorPage,
  ListsPage,
  OfferDetailPage,
  OffersPage,
  OptimizationPage,
  SignInPage,
  SignUpPage,
} from '@/public/public-pages';

export const publicRoute = {
  path: '/',
  element: <PublicLayout />,
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
      path: 'listas/:listId',
      element: <ListEditorPage />,
    },
    {
      path: 'listas/:listId/checklist',
      element: <ChecklistPage />,
    },
    {
      path: 'otimizacao/:listId',
      element: <OptimizationPage />,
    },
  ],
};
