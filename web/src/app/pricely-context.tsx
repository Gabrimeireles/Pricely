import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  getCityById,
  getOptimizationScenarios,
  initialShoppingLists,
  profileSnapshot,
  supportedCities,
} from './mock-data';
import type { OptimizationModeId, ShoppingList } from './types';

interface PricelyContextValue {
  cityId: string;
  setCityId: (cityId: string) => void;
  cities: typeof supportedCities;
  lists: ShoppingList[];
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  updateList: (list: ShoppingList) => void;
  addList: (list: ShoppingList) => void;
  profile: typeof profileSnapshot;
  preferredMode: OptimizationModeId;
  setPreferredMode: (mode: OptimizationModeId) => void;
}

const STORAGE_KEY = 'pricely-web-state';

const PricelyContext = createContext<PricelyContextValue | null>(null);

export function PricelyProvider({ children }: PropsWithChildren) {
  const [cityId, setCityId] = useState(initialShoppingLists[0].cityId);
  const [lists, setLists] = useState<ShoppingList[]>(initialShoppingLists);
  const [selectedListId, setSelectedListId] = useState(initialShoppingLists[0].id);
  const [preferredMode, setPreferredMode] = useState<OptimizationModeId>(
    initialShoppingLists[0].lastMode,
  );

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<{
        cityId: string;
        lists: ShoppingList[];
        selectedListId: string;
        preferredMode: OptimizationModeId;
      }>;

      if (parsed.cityId) {
        setCityId(parsed.cityId);
      }
      if (parsed.lists?.length) {
        setLists(parsed.lists);
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
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cityId, lists, selectedListId, preferredMode }),
    );
  }, [cityId, lists, selectedListId, preferredMode]);

  const value = useMemo<PricelyContextValue>(
    () => ({
      cityId,
      setCityId,
      cities: supportedCities,
      lists,
      selectedListId,
      setSelectedListId,
      updateList: (updatedList) => {
        setLists((current) =>
          current.map((list) => (list.id === updatedList.id ? updatedList : list)),
        );
      },
      addList: (list) => {
        setLists((current) => [list, ...current]);
      },
      profile: profileSnapshot,
      preferredMode,
      setPreferredMode,
    }),
    [cityId, lists, preferredMode, selectedListId],
  );

  useEffect(() => {
    const activeList = lists.find((list) => list.id === selectedListId);
    if (!activeList) {
      return;
    }

    if (activeList.cityId !== cityId) {
      setCityId(activeList.cityId);
    }

    const scenarios = getOptimizationScenarios(activeList.id);
    if (!scenarios.some((scenario) => scenario.mode === preferredMode)) {
      setPreferredMode(activeList.lastMode);
    }
  }, [cityId, lists, preferredMode, selectedListId]);

  useEffect(() => {
    if (!supportedCities.some((city) => city.id === cityId)) {
      setCityId(getCityById(initialShoppingLists[0].cityId).id);
    }
  }, [cityId]);

  return <PricelyContext.Provider value={value}>{children}</PricelyContext.Provider>;
}

export function usePricely() {
  const context = useContext(PricelyContext);
  if (!context) {
    throw new Error('usePricely must be used within PricelyProvider');
  }

  return context;
}

