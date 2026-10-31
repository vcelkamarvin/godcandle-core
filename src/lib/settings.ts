import { useState, useEffect, useCallback } from 'react';

export type TerminalDensity = 'pro' | 'standard';

export interface UserSettings {
  oneClickTrading: boolean;
  defaultMargin: number;
  defaultLeverage: number;
  terminalDensity: TerminalDensity;
}

export const DEFAULT_SETTINGS: UserSettings = {
  oneClickTrading: true,
  defaultMargin: 50,
  defaultLeverage: 500,
  terminalDensity: 'standard',
};

const SETTINGS_STORAGE_KEY = 'godcandle_settings';
const SETTINGS_EVENT = 'godcandle_settings_change';

export function getStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      // Check legacy individual keys if present
      const legacyMargin = localStorage.getItem('godcandle_default_margin');
      const legacyLev = localStorage.getItem('godcandle_default_leverage');
      const legacyOneClick = localStorage.getItem('godcandle_one_click_trading');
      const legacyDensity = localStorage.getItem('godcandle_terminal_density');

      return {
        oneClickTrading: legacyOneClick !== null ? legacyOneClick === 'true' : DEFAULT_SETTINGS.oneClickTrading,
        defaultMargin: legacyMargin ? Number(legacyMargin) || DEFAULT_SETTINGS.defaultMargin : DEFAULT_SETTINGS.defaultMargin,
        defaultLeverage: legacyLev ? Number(legacyLev) || DEFAULT_SETTINGS.defaultLeverage : DEFAULT_SETTINGS.defaultLeverage,
        terminalDensity: legacyDensity === 'pro' || legacyDensity === 'standard' ? legacyDensity : DEFAULT_SETTINGS.terminalDensity,
      };
    }

    const parsed = JSON.parse(raw);
    return {
      oneClickTrading: typeof parsed.oneClickTrading === 'boolean' ? parsed.oneClickTrading : DEFAULT_SETTINGS.oneClickTrading,
      defaultMargin: typeof parsed.defaultMargin === 'number' && parsed.defaultMargin > 0 ? parsed.defaultMargin : DEFAULT_SETTINGS.defaultMargin,
      defaultLeverage: typeof parsed.defaultLeverage === 'number' && parsed.defaultLeverage > 0 ? parsed.defaultLeverage : DEFAULT_SETTINGS.defaultLeverage,
      terminalDensity: parsed.terminalDensity === 'pro' || parsed.terminalDensity === 'standard' ? parsed.terminalDensity : DEFAULT_SETTINGS.terminalDensity,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(partial: Partial<UserSettings>): UserSettings {
  const current = getStoredSettings();
  const updated: UserSettings = {
    ...current,
    ...partial,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      // Also sync discrete keys for backwards compatibility
      if (partial.defaultMargin !== undefined) {
        localStorage.setItem('godcandle_default_margin', String(partial.defaultMargin));
      }
      if (partial.defaultLeverage !== undefined) {
        localStorage.setItem('godcandle_default_leverage', String(partial.defaultLeverage));
      }
      if (partial.oneClickTrading !== undefined) {
        localStorage.setItem('godcandle_one_click_trading', String(partial.oneClickTrading));
      }
      if (partial.terminalDensity !== undefined) {
        localStorage.setItem('godcandle_terminal_density', partial.terminalDensity);
      }

      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: updated }));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  return updated;
}

export function resetStoredSettings(): UserSettings {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.removeItem('godcandle_default_margin');
      localStorage.removeItem('godcandle_default_leverage');
      localStorage.removeItem('godcandle_one_click_trading');
      localStorage.removeItem('godcandle_terminal_density');
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: DEFAULT_SETTINGS }));
    } catch (e) {
      console.error('Failed to reset settings:', e);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());

  useEffect(() => {
    // Initial sync
    setSettings(getStoredSettings());

    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<UserSettings>;
      if (custom.detail) {
        setSettings(custom.detail);
      } else {
        setSettings(getStoredSettings());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY || !e.key) {
        setSettings(getStoredSettings());
      }
    };

    window.addEventListener(SETTINGS_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    saveSettings({ [key]: value } as Partial<UserSettings>);
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    saveSettings(partial);
  }, []);

  const reset = useCallback(() => {
    resetStoredSettings();
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings: reset,
  };
}
