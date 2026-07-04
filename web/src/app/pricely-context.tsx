import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  completeShoppingListCheckout,
  createLocationPreference,
  previewLocationCoverage as previewLocationCoverageRequest,
  createShoppingList,
  fetchLocationPreferences,
  fetchPublicRegions,
  fetchMe,
  fetchLatestOptimization,
  fetchShoppingLists,
  mapProfile,
  mapShoppingList,
  replaceShoppingList,
  reportShoppingListItemPriceMismatch,
  runOptimization as runOptimizationRequest,
  refreshSession,
  shareShoppingList as shareShoppingListRequest,
  signIn as signInRequest,
  signOutSession,
  signUp as signUpRequest,
  updatePreferredRegion as updatePreferredRegionRequest,
  updateShoppingListItemPurchaseStatus,
  type OptimizationResultApiResponse,
  type CoveragePreviewResponse,
  type UserLocationPreferenceResponse,
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
  locationPreferences: UserLocationPreferenceResponse[];
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
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
      brandPreferenceMode?: 'any' | 'preferred' | 'exact';
      preferredBrandNames?: string[];
      purchaseStatus?: 'pending' | 'purchased';
      quantity: number;
      unitLabel: string;
      note?: string;
    }>;
  }) => Promise<ShoppingList>;
  shareList: (listId: string) => Promise<ShoppingList>;
  optimizationResults: Record<
    string,
    OptimizationResultApiResponse | undefined
  >;
  updateListItemPurchaseStatus: (
    listId: string,
    itemId: string,
    purchaseStatus: 'pending' | 'purchased',
  ) => Promise<ShoppingList>;
  completeListCheckout: (
    listId: string,
    paidTotal?: number,
  ) => Promise<ShoppingList>;
  reportListItemPriceMismatch: (
    listId: string,
    itemId: string,
    input: {
      expectedPrice?: number;
      reportedPrice?: number;
      reason?: string;
    },
  ) => Promise<void>;
  runOptimization: (
    listId: string,
    mode: OptimizationModeId,
    input?: {
      userLocationPreferenceId?: string;
      coverageRadiusKm?: number;
    },
  ) => Promise<OptimizationResultApiResponse>;
  saveBrowserLocation: (input: {
    label?: string;
    latitude: number;
    longitude: number;
    coverageRadiusKm?: number;
  }) => Promise<UserLocationPreferenceResponse>;
  savePostalCodeLocation: (input: {
    label?: string;
    postalCode: string;
    coverageRadiusKm?: number;
  }) => Promise<UserLocationPreferenceResponse>;
  previewLocationCoverage: (input: {
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    coverageRadiusKm?: number;
  }) => Promise<CoveragePreviewResponse>;
  loadLatestOptimization: (
    listId: string,
  ) => Promise<OptimizationResultApiResponse | null>;
}

const STORAGE_KEY = 'pricely-web-state-v2';

const PricelyContext = createContext<PricelyContextValue | null>(null);

function emptyProfile() {
  return {
    totalEstimatedSavings: 0,
    listsCreated: 0,
    receiptsShared: 0,
    invalidPromotionReports: 0,
    entitlementPlan: 'free' as const,
    entitlementStatus: 'active' as const,
    availableOptimizationTokens: 0,
    monthlyFreeOptimizationTokens: 2,
    billingEnabled: false,
    checkoutEnabled: false,
  };
}

export function PricelyProvider({ children }: PropsWithChildren) {
  const [cityId, setCityIdState] = useState<string | null>(null);
  const [cities, setCities] = useState(supportedCities);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [preferredMode, setPreferredMode] =
    useState<OptimizationModeId>('global_multi');
  const [profile, setProfile] = useState(profileSnapshot);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [optimizationResults, setOptimizationResults] = useState<
    Record<string, OptimizationResultApiResponse | undefined>
  >({});
  const [locationPreferences, setLocationPreferences] = useState<
    UserLocationPreferenceResponse[]
  >([]);

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
            regionId: region.id,
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
            stores:
              region.establishments?.map((establishment) => ({
                id: establishment.id,
                name: establishment.unitName,
                brandName: establishment.brandName,
                neighborhood: establishment.neighborhood,
                offerCount: establishment.offerCount,
              })) ?? [],
            neighborhoods: Array.from(
              new Set(
                region.establishments
                  ?.map((establishment) => establishment.neighborhood)
                  .filter(Boolean) ?? [],
              ),
            ),
          })),
        );
      } catch {
        if (!disposed) {
          setCities(supportedCities);
        }
      }
    };

    void loadRegions();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

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
    let disposed = false;

    const restoreSession = async () => {
      setIsBootstrapping(true);
      try {
        const session = await refreshSession();
        if (disposed) {
          return;
        }
        applySession(session);
      } catch {
        if (!disposed) {
          setToken(null);
          setCurrentUser(null);
          setProfile(emptyProfile());
        }
      } finally {
        if (!disposed) {
          setIsBootstrapping(false);
        }
      }
    };

    void restoreSession();

    return () => {
      disposed = true;
    };
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
      setLocationPreferences([]);
      setProfile(emptyProfile());
      setCurrentUser(null);
      return;
    }

    let disposed = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);

      try {
        const [user, shoppingLists, locations] = await Promise.all([
          fetchMe(token),
          fetchShoppingLists(token),
          fetchLocationPreferences(token).catch(() => []),
        ]);

        if (disposed) {
          return;
        }

        const mappedLists = shoppingLists.map(mapShoppingList);
        setProfile(mapProfile(user));
        setLocationPreferences(locations);
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
          setToken(null);
          setLists([]);
          setLocationPreferences([]);
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

  const applySession = (session: Awaited<ReturnType<typeof signInRequest>>) => {
    setCurrentUser({
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role,
    });
    setProfile(mapProfile(session.user));
    setToken(session.accessToken);
    setCityIdState(session.user.preferredRegionSlug ?? null);
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
      locationPreferences,
      currentUser,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      signIn: async (email, password) => {
        const session = await signInRequest(email, password);
        applySession(session);
      },
      signUp: async (email, password, displayName) => {
        const session = await signUpRequest(email, password, displayName);
        applySession(session);
      },
      signOut: () => {
        void signOutSession().catch(() => undefined);
        setToken(null);
        setCurrentUser(null);
        setLists([]);
        setSelectedListId('');
        setOptimizationResults({});
        setLocationPreferences([]);
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
            return current.map((entry) =>
              entry.id === mapped.id ? mapped : entry,
            );
          }
          return [mapped, ...current];
        });
        setSelectedListId(mapped.id);
        return mapped;
      },
      shareList: async (listId) => {
        if (!token) {
          throw new Error('Voce precisa entrar para compartilhar uma lista.');
        }

        const updated = await shareShoppingListRequest(token, listId);
        const mapped = mapShoppingList(updated);
        setLists((current) =>
          current.map((entry) => (entry.id === mapped.id ? mapped : entry)),
        );
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
      completeListCheckout: async (listId, paidTotal) => {
        if (!token) {
          throw new Error('Voce precisa entrar para concluir o checklist.');
        }

        const updated = await completeShoppingListCheckout(
          token,
          listId,
          paidTotal,
        );
        const mapped = mapShoppingList(updated);
        setLists((current) =>
          current.map((entry) => (entry.id === mapped.id ? mapped : entry)),
        );
        return mapped;
      },
      reportListItemPriceMismatch: async (listId, itemId, input) => {
        if (!token) {
          throw new Error('Voce precisa entrar para reportar um preço.');
        }

        await reportShoppingListItemPriceMismatch(token, listId, itemId, input);
      },
      runOptimization: async (listId, mode, input) => {
        if (!token) {
          throw new Error('Você precisa entrar para otimizar uma lista.');
        }

        const list = lists.find((entry) => entry.id === listId);
        const userLocationPreferenceId =
          input?.userLocationPreferenceId ??
          locationPreferences.find(
            (preference) =>
              preference.isDefault &&
              (!list?.cityId || preference.regionSlug === list.cityId),
          )?.id;
        const result = await runOptimizationRequest(token, listId, mode, {
          ...input,
          userLocationPreferenceId,
        });
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
      saveBrowserLocation: async (input) => {
        if (!token) {
          throw new Error('Voce precisa entrar para salvar a localizacao.');
        }

        const activeCity = cities.find((city) => city.id === cityId);
        if (!activeCity) {
          throw new Error('Escolha uma cidade antes de salvar a localizacao.');
        }

        const saved = await createLocationPreference(token, {
          regionId: activeCity.regionId ?? activeCity.id,
          label: input.label ?? 'Local atual',
          latitude: input.latitude,
          longitude: input.longitude,
          coverageRadiusKm: input.coverageRadiusKm ?? 5,
          isDefault: true,
          locationSource: 'browser_geolocation',
        });
        setLocationPreferences((current) => [
          saved,
          ...current
            .filter((entry) => entry.id !== saved.id)
            .map((entry) =>
              entry.regionId === saved.regionId
                ? { ...entry, isDefault: false }
                : entry,
            ),
        ]);
        return saved;
      },
      savePostalCodeLocation: async (input) => {
        if (!token) {
          throw new Error('Voce precisa entrar para salvar o CEP.');
        }

        const activeCity = cities.find((city) => city.id === cityId);
        if (!activeCity) {
          throw new Error('Escolha uma cidade antes de salvar o CEP.');
        }

        const saved = await createLocationPreference(token, {
          regionId: activeCity.regionId ?? activeCity.id,
          label: input.label ?? `CEP ${input.postalCode}`,
          postalCode: input.postalCode,
          coverageRadiusKm: input.coverageRadiusKm ?? 5,
          isDefault: true,
          locationSource: 'postal_code_fallback',
        });
        setLocationPreferences((current) => [
          saved,
          ...current
            .filter((entry) => entry.id !== saved.id)
            .map((entry) =>
              entry.regionId === saved.regionId
                ? { ...entry, isDefault: false }
                : entry,
            ),
        ]);
        return saved;
      },
      previewLocationCoverage: async (input) => {
        if (!token) {
          throw new Error('Voce precisa entrar para prever a cobertura local.');
        }

        const activeCity = cities.find((city) => city.id === cityId);
        if (!activeCity) {
          throw new Error('Escolha uma cidade antes de prever a cobertura.');
        }

        return previewLocationCoverageRequest(token, {
          regionId: activeCity.regionId ?? activeCity.id,
          coverageRadiusKm: input.coverageRadiusKm ?? 5,
          latitude: input.latitude,
          longitude: input.longitude,
          postalCode: input.postalCode,
        });
      },
      loadLatestOptimization: async (listId) => {
        if (!token) {
          return null;
        }

        try {
          const result = await fetchLatestOptimization(token, listId);
          setOptimizationResults((current) => ({
            ...current,
            [listId]: result,
          }));
          setLists((current) =>
            current.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    lastMode: result.mode,
                    expectedSavings:
                      result.estimatedSavings ?? list.expectedSavings,
                  }
                : list,
            ),
          );
          return result;
        } catch {
          return null;
        }
      },
    }),
    [
      cities,
      cityId,
      currentUser,
      isBootstrapping,
      lists,
      locationPreferences,
      optimizationResults,
      preferredMode,
      profile,
      selectedListId,
      token,
    ],
  );

  return (
    <PricelyContext.Provider value={value}>{children}</PricelyContext.Provider>
  );
}

export function usePricely() {
  const context = useContext(PricelyContext);
  if (!context) {
    throw new Error('usePricely must be used within PricelyProvider');
  }

  return context;
}
