import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type MonetaryPrivacyContextValue = {
  isMoneyVisible: boolean;
  setMoneyVisible: (visible: boolean) => void;
  toggleMoneyVisibility: () => void;
};

const STORAGE_KEY = 'pricely-money-visible-v1';

const MonetaryPrivacyContext =
  createContext<MonetaryPrivacyContextValue | null>(null);

export function MonetaryPrivacyProvider({ children }: PropsWithChildren) {
  const [isMoneyVisible, setIsMoneyVisible] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem(STORAGE_KEY) !== 'hidden';
  });

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      isMoneyVisible ? 'visible' : 'hidden',
    );
  }, [isMoneyVisible]);

  const value = useMemo<MonetaryPrivacyContextValue>(
    () => ({
      isMoneyVisible,
      setMoneyVisible: setIsMoneyVisible,
      toggleMoneyVisibility: () =>
        setIsMoneyVisible((currentValue) => !currentValue),
    }),
    [isMoneyVisible],
  );

  return (
    <MonetaryPrivacyContext.Provider value={value}>
      {children}
    </MonetaryPrivacyContext.Provider>
  );
}

export function useMonetaryPrivacy() {
  const context = useContext(MonetaryPrivacyContext);

  if (!context) {
    throw new Error(
      'useMonetaryPrivacy must be used inside MonetaryPrivacyProvider',
    );
  }

  return context;
}
