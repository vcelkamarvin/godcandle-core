import { describe, expect, it, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  getStoredSettings,
  saveSettings,
  resetStoredSettings,
  DEFAULT_SETTINGS,
} from '@/lib/settings';
import { hyperliquidEngineInstance } from '@/lib/engine/hyperliquid';

describe('Settings Management & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('provides sensible default settings when storage is empty', () => {
    const settings = getStoredSettings();
    expect(settings.oneClickTrading).toBe(true);
    expect(settings.defaultMargin).toBe(50);
    expect(settings.defaultLeverage).toBe(500);
    expect(settings.terminalDensity).toBe('standard');
  });

  it('persists changes to localStorage and emits an update event', () => {
    let capturedDetail: any = null;
    const listener = (e: any) => {
      capturedDetail = e.detail;
    };
    window.addEventListener('godcandle_settings_change', listener);

    const updated = saveSettings({
      defaultMargin: 100,
      defaultLeverage: 250,
      terminalDensity: 'pro',
      oneClickTrading: false,
    });

    expect(updated.defaultMargin).toBe(100);
    expect(updated.defaultLeverage).toBe(250);
    expect(updated.terminalDensity).toBe('pro');
    expect(updated.oneClickTrading).toBe(false);

    expect(capturedDetail).toEqual({
      defaultMargin: 100,
      defaultLeverage: 250,
      terminalDensity: 'pro',
      oneClickTrading: false,
    });

    const stored = getStoredSettings();
    expect(stored.defaultMargin).toBe(100);
    expect(stored.defaultLeverage).toBe(250);
    expect(stored.terminalDensity).toBe('pro');
    expect(stored.oneClickTrading).toBe(false);

    window.removeEventListener('godcandle_settings_change', listener);
  });

  it('gracefully handles corrupted JSON in localStorage', () => {
    localStorage.setItem('godcandle_settings', '{ bad: json ///');
    const settings = getStoredSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('resets settings to system defaults', () => {
    saveSettings({ defaultMargin: 250, terminalDensity: 'pro', oneClickTrading: false });
    expect(getStoredSettings().defaultMargin).toBe(250);

    const reset = resetStoredSettings();
    expect(reset).toEqual(DEFAULT_SETTINGS);
    expect(getStoredSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('revokes session keys and clears browser storage via hyperliquidEngineInstance', () => {
    sessionStorage.setItem('godcandle_hl_agent_key_approved_master', '0xmaster');
    sessionStorage.setItem('godcandle_hl_session_confirmed', 'true');
    hyperliquidEngineInstance.markAgentApproved('0xmaster');
    expect(hyperliquidEngineInstance.getAgentState()?.isApproved).toBe(true);

    hyperliquidEngineInstance.revokeSessionKeys();

    expect(sessionStorage.getItem('godcandle_hl_agent_key_approved_master')).toBeNull();
    expect(sessionStorage.getItem('godcandle_hl_session_confirmed')).toBeNull();
    expect(hyperliquidEngineInstance.getAgentState()?.isApproved).toBe(false);
  });

  it('safely handles non-positive numbers and invalid densities in getStoredSettings', () => {
    localStorage.setItem(
      'godcandle_settings',
      JSON.stringify({
        defaultMargin: -50,
        defaultLeverage: 0,
        terminalDensity: 'ultra-dense',
        oneClickTrading: 'not-a-bool',
      })
    );
    const settings = getStoredSettings();
    expect(settings.defaultMargin).toBe(DEFAULT_SETTINGS.defaultMargin);
    expect(settings.defaultLeverage).toBe(DEFAULT_SETTINGS.defaultLeverage);
    expect(settings.terminalDensity).toBe(DEFAULT_SETTINGS.terminalDensity);
    expect(settings.oneClickTrading).toBe(DEFAULT_SETTINGS.oneClickTrading);
  });

  it('tracks first order confirmation and purges it on revocation', () => {
    expect(hyperliquidEngineInstance.hasConfirmedFirstOrder()).toBe(false);
    hyperliquidEngineInstance.confirmFirstOrder();
    expect(hyperliquidEngineInstance.hasConfirmedFirstOrder()).toBe(true);
    hyperliquidEngineInstance.revokeSessionKeys();
    expect(hyperliquidEngineInstance.hasConfirmedFirstOrder()).toBe(false);
  });
});

describe('Settings Interface Structure & Content Requirements', () => {
  const settingsViewPath = path.resolve(__dirname, '../components/settings/SettingsView.tsx');
  const settingsViewContent = fs.readFileSync(settingsViewPath, 'utf-8');

  const settingsRoutePath = path.resolve(__dirname, '../routes/settings.tsx');
  const settingsRouteContent = fs.readFileSync(settingsRoutePath, 'utf-8');

  const headerPath = path.resolve(__dirname, '../components/layout/Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  it('implements Section 1: Trading Preferences (Execution) with 1-click warning, margin chips, and leverage slider', () => {
    expect(settingsViewContent).toContain('1-Click Trading (Session Keys)');
    expect(settingsViewContent).toContain('Bypasses wallet confirmation. Use with caution.');
    expect(settingsViewContent).toContain('Default Margin (USDC)');
    expect(settingsViewContent).toContain('MARGIN_PRESETS');
    expect(settingsViewContent).toContain('Default Leverage');
    expect(settingsViewContent).toContain('LEVERAGE_PRESETS');
  });

  it('implements Section 2: Network & RPC Diagnostics with HyperEVM Mainnet, Chain ID 999, and RPC endpoint', () => {
    expect(settingsViewContent).toContain('HyperEVM Mainnet');
    expect(settingsViewContent).toContain('999');
    expect(settingsViewContent).toContain('https://rpc.hyperliquid.xyz/evm');
    expect(settingsViewContent).toContain('Real-Time Ping / Latency');
    expect(settingsViewContent).toContain('useRpcPing');
  });

  it('implements Section 3: Layout & UI Compactness with Pro Mode / Standard density toggle and dark theme enforcement', () => {
    expect(settingsViewContent).toContain('Terminal Density');
    expect(settingsViewContent).toContain('Standard');
    expect(settingsViewContent).toContain('Pro Mode');
    expect(settingsViewContent).toContain('DARK QUANT MONO (LOCKED)');
    expect(settingsViewContent).toContain('#080B0F');
  });

  it('implements Section 4: Danger Zone with Revoke Session Keys and Disconnect Wallet', () => {
    expect(settingsViewContent).toContain('DANGER ZONE (WALLET MANAGEMENT)');
    expect(settingsViewContent).toContain('Revoke Session Keys');
    expect(settingsViewContent).toContain('Disconnect Wallet');
    expect(settingsViewContent).toContain('wagmiDisconnect');
    expect(settingsViewContent).toContain('revokeSessionKeys');
  });

  it('implements Section 5: Header Navigation and route linking', () => {
    expect(headerContent).toContain('to="/settings"');
    expect(headerContent).toContain('Settings');
    expect(headerContent).toContain('SettingsModal');
    expect(settingsRouteContent).toContain("createFileRoute('/settings')");
  });
});
