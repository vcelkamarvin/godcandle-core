import { profileWalletMap, ProfileMapping } from "../data/profileWalletMap";
import { isValidEvmAddress } from "./hyperliquidClient";

export interface ResolvedWalletResult {
  address: string | null;
  method: "manual-registry" | "auto-detected" | "user-override" | "none";
  username: string;
}

const STORAGE_KEY = "godcandle_user_wallet_mappings";

export async function getUserMappings(): Promise<Record<string, ProfileMapping>> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      return data[STORAGE_KEY] || {};
    } catch (e) {
      console.warn("Failed to load user mappings from storage:", e);
    }
  }
  return {};
}

export async function saveUserMapping(
  username: string,
  mapping: ProfileMapping
): Promise<void> {
  const cleanUsername = username.replace(/^@/, "").toLowerCase();
  const current = await getUserMappings();
  current[cleanUsername] = mapping;
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: current });
  }
}

export async function removeUserMapping(username: string): Promise<void> {
  const cleanUsername = username.replace(/^@/, "").toLowerCase();
  const current = await getUserMappings();
  delete current[cleanUsername];
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: current });
  }
}

/**
 * Resolves wallet according to priority:
 * 1. User-confirmed manual mapping (from chrome storage)
 * 2. Static profile registry (profileWalletMap)
 * 3. Explicitly detected EVM address in profile DOM bio / description
 * 4. None
 */
export async function resolveWalletForProfile(
  rawUsername: string,
  domBioText?: string
): Promise<ResolvedWalletResult> {
  const cleanUsername = rawUsername.replace(/^@/, "").trim().toLowerCase();

  // 1. User stored mapping
  const userMappings = await getUserMappings();
  for (const [key, mapping] of Object.entries(userMappings)) {
    if (key.toLowerCase() === cleanUsername && mapping.enabled && isValidEvmAddress(mapping.address)) {
      return {
        address: mapping.address.toLowerCase(),
        method: "user-override",
        username: rawUsername
      };
    }
  }

  // 2. Predefined manual registry
  for (const [key, mapping] of Object.entries(profileWalletMap)) {
    if (key.toLowerCase() === cleanUsername && mapping.enabled && isValidEvmAddress(mapping.address)) {
      return {
        address: mapping.address.toLowerCase(),
        method: "manual-registry",
        username: rawUsername
      };
    }
  }

  // 3. Auto-detection from bio text
  if (domBioText) {
    const evmRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = domBioText.match(evmRegex);
    if (matches && matches.length > 0) {
      const detected = matches[0];
      if (isValidEvmAddress(detected)) {
        return {
          address: detected.toLowerCase(),
          method: "auto-detected",
          username: rawUsername
        };
      }
    }
  }

  return {
    address: null,
    method: "none",
    username: rawUsername
  };
}
