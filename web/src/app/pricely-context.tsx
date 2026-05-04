import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  createShoppingList,
  fetchPublicRegions,
  fetchMe,
  fetchShoppingLists,
  mapProfile,
  mapShoppingList,
  replaceShoppingList,
  runOptimization as runOptimizationRequest,
  signIn as signInRequest,
  signUp as signUpRequest,
  updatePreferredRegion as updatePreferredRegionRequest,
  updateShoppingListItemPurchaseStatus,
  type OptimizationResultApiResponse,
} from './api';
import { profileSnapshot, supportedCities } from './mock-data';
import type { OptimizationModeId, ShoppingList } from './types';

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
};

interface PricelyContextValue {
  accessToken: string | null;
  cityId: string | null;
  setCityId: (cityId: string) => Promise<void>;
  cities: typeof supportedCities;
  lists: ShoppingList[];
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  profile: typeof profileSnapshot;
  preferredMode: OptimizationModeId;
  setPreferredMode: (mode: OptimizationModeId) => void;
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => void;
  saveList: (input: {
    id?: string;
    name: string;
    cityId: string;
    lastMode: OptimizationModeId;
    items: Array<{
      name: string;
      catalogProductId?: string;
      lockedProductVariantId?: string;
      brandPreferenceMode?: 'any' | 'exact';
      preferredBrandNames?: string[];
      purchaseStatus?: 'pending' | 'purchased';
      quantity: number;
      unitLabel: string;
      note?: string;
    }>;
  }) => Promise<ShoppingList>;
  optimizationResults: Record<string, OptimizationResultApiResponse | undefined>;
  updateListItemPurchaseStatus: (
    listId: string,
    itemId: string,
    purchaseStatus: 'pending' | 'purchased',
  ) => Promise<ShoppingList>;
  runOptimization: (
    listId: string,
    mode: OptimizationModeId,
  ) => Promise<OptimizationResultApiResponse>;
}

const STORAGE_KEY = 'pricely-web-state-v2';
const TOKEN_KEY = 'pricely-auth-token';

const PricelyContext = createContext<PricelyContextValue | null>(null);

function emptyProfile() {
  return {
    totalEstimatedSavings: 0,
    listsCreated: 0,
    receiptsShared: 0,
    invalidPromotionReports: 0,
  };
}

export function PricelyProvider({ children }: PropsWithChildren) {
  const [cityId, setCityIdState] = useState<string | null>(null);
  const [cities, setCities] = useState(supportedCities);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [preferredMode, setPreferredMode] = useState<OptimizationModeId>('global_full');
  const [profile, setProfile] = useState(profileSnapshot);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [optimizationResults, setOptimizationResults] = useState<
    Record<string, OptimizationResultApiResponse | undefined>
  >({});

  useEffect(() => {
    let disposed = false;

    const loadRegions = async () => {
      try {
        const regions = await fetchPublicRegions();

        if (disposed || regions.length === 0) {
          return;
        }

        setCities(
          regions.map((region) => ({
            id: region.slug,
            name: region.name,
            stateCode: region.stateCode,
            activeStoreCount: region.activeEstablishmentCount,
            coverageStatus: region.offerCoverageStatus,
            regionLabel:
              region.offerCoverageStatus === 'live'
                ? `${region.activeEstablishmentCount} estabelecimentos ativos`
                : `${region.activeEstablishmentCount} estabelecimentos · coletando dados`,
            status:
              region.implantationStatus === 'active'
                ? 'supported'
                : region.implantationStatus === 'activating'
                  ? 'pilot'
                  : 'soon',
            stores: [],
            neighborhoods: [],
          })),
        );
      } catch {
        setCities(supportedCities);
      }
    };

    void loadRegions();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (rawState) {
      try {
        const parsed = JSON.parse(rawState) as Partial<{
          cityId: string;
          selectedListId: string;
          preferredMode: OptimizationModeId;
        }>;

        if (parsed.cityId) {
          setCityIdState(parsed.cityId);
        }
        if (parsed.selectedListId) {
          setSelectedListId(parsed.selectedListId);
        }
        if (parsed.preferredMode) {
          setPreferredMode(parsed.preferredMode);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cityId, selectedListId, preferredMode }),
    );
  }, [cityId, preferredMode, selectedListId]);

  useEffect(() => {
    if (!token) {
      setLists([]);
      setProfile(emptyProfile());
      setCurrentUser(null);
      setIsBootstrapping(false);
      return;
    }

    let disposed = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);

      try {
        const [user, shoppingLists] = await Promise.all([
          fetchMe(token),
          fetchShoppingLists(token),
        ]);

        if (disposed) {
          return;
        }

        const mappedLists = shoppingLists.map(mapShoppingList);
        setProfile(mapProfile(user));
        setCurrentUser({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        });
        setLists(mappedLists);
        setSelectedListId((current) => current || mappedLists[0]?.id || '');
        setCityIdState(user.preferredRegionSlug ?? null);
      } catch {
        if (!disposed) {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setLists([]);
          setProfile(emptyProfile());
          setCurrentUser(null);
          setCityIdState(null);
        }
      } finally {
        if (!disposed) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      disposed = true;
    };
  }, [token]);

  const setCityId = async (nextCityId: string) => {
    setCityIdState(nextCityId);

    if (!token) {
      return;
    }

    const updatedUser = await updatePreferredRegionRequest(token, nextCityId);
    setCurrentUser({
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
    });
    setProfile(mapProfile(updatedUser));
  };

  const value = useMemo<PricelyContextValue>(
    () => ({
      accessToken: token,
      cityId,
      setCityId,
      cities,
      lists,
      selectedListId,
      setSelectedListId,
      profile,
      preferredMode,
      setPreferredMode,
      currentUser,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      signIn: async (email, password) => {
        const session = await signInRequest(email, password);
        window.localStorage.setItem(TOKEN_KEY, session.accessToken);
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          role: session.user.role,
        });
        setProfile(mapProfile(session.user));
        setToken(session.accessToken);
        setCityIdState(session.user.preferredRegionSlug ?? null);
      },
      signUp: async (email, password, displayName) => {
        const session = await signUpRequest(email, password, displayName);
        window.localStorage.setItem(TOKEN_KEY, session.accessToken);
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          role: session.user.role,
        });
        setProfile(mapProfile(session.user));
        setToken(session.accessToken);
        setCityIdState(session.user.preferredRegionSlug ?? null);
      },
      signOut: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setCurrentUser(null);
        setLists([]);
        setSelectedListId('');
        setOptimizationResults({});
        setProfile(emptyProfile());
        setCityIdState(null);
      },
      saveList: async (input) => {
        if (!token) {
          throw new Error('Você precisa entrar para salvar uma lista.');
        }

        const payload = {
          name: input.name,
          preferredRegionId: input.cityId,
          lastMode: input.lastMode,
          items: input.items.map((item) => ({
            requestedName: item.name,
            catalogProductId: item.catalogProductId,
            lockedProductVariantId: item.lockedProductVariantId,
            brandPreferenceMode: item.brandPreferenceMode,
            preferredBrandNames: item.preferredBrandNames,
            purchaseStatus: item.purchaseStatus,
            quantity: item.quantity,
            unitLabel: item.unitLabel,
            notes: item.note,
          })),
        };

        const saved = input.id
          ? await replaceShoppingList(token, input.id, payload)
          : await createShoppingList(token, {
              name: payload.name,
              preferredRegionId: payload.preferredRegionId,
              lastMode: payload.lastMode,
            }).then((created) =>
              replaceShoppingList(token, created.id, {
                ...payload,
              }),
            );

        const mapped = mapShoppingList(saved);
        setLists((current) => {
          const existing = current.find((entry) => entry.id === mapped.id);
          if (existing) {
            return current.map((entry) => (entry.id === mapped.id ? mapped : entry));
          }
          return [mapped, ...current];
        });
        setSelectedListId(mapped.id);
        return mapped;
      },
      optimizationResults,
      updateListItemPurchaseStatus: async (listId, itemId, purchaseStatus) => {
        if (!token) {
          throw new Error('Voce precisa entrar para atualizar o checklist.');
        }

        const updated = await updateShoppingListItemPurchaseStatus(
          token,
          listId,
          itemId,
          purchaseStatus,
        );
        const mapped = mapShoppingList(updated);
        setLists((current) =>
          current.map((entry) => (entry.id === mapped.id ? mapped : entry)),
        );
        return mapped;
      },
      runOptimization: async (listId, mode) => {
        if (!token) {
          throw new Error('Você precisa entrar para otimizar uma lista.');
        }

        const result = await runOptimizationRequest(token, listId, mode);
        setOptimizationResults((current) => ({
          ...current,
          [listId]: result,
        }));
        setLists((current) =>
          current.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  lastMode: mode,
                  expectedSavings:
                    result.estimatedSavings ?? list.expectedSavings,
                }
              : list,
          ),
        );
        setPreferredMode(mode);
        return result;
      },
    }),
    [
      cities,
      cityId,
      currentUser,
      isBootstrapping,
      lists,
      optimizationResults,
      preferredMode,
      profile,
      selectedListId,
      token,
    ],
  );

  return <PricelyContext.Provider value={value}>{children}</PricelyContext.Provider>;
}

export function usePricely() {
  const context = useContext(PricelyContext);
  if (!context) {
    throw new Error('usePricely must be used within PricelyProvider');
  }

  return context;
}
