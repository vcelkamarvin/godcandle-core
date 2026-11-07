import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GodcandleCard } from "./components/GodcandleCard";
import { useTraderProfile } from "./hooks/useTraderProfile";
import { useLiveUpdates } from "./hooks/useLiveUpdates";
import { resolveWalletForProfile, saveUserMapping } from "./services/walletResolver";

interface ExtensionCardWrapperProps {
  username: string;
}

const ExtensionCardWrapper: React.FC<ExtensionCardWrapperProps> = ({ username }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Extract bio text from profile header if available
  const getBioText = (): string => {
    const bioEl = document.querySelector('[data-testid="UserDescription"]');
    return bioEl ? (bioEl as HTMLElement).innerText : "";
  };

  const resolve = useCallback(async () => {
    try {
      const bio = getBioText();
      const res = await resolveWalletForProfile(username, bio);
      setWalletAddress(res.address);
    } catch (e) {
      console.warn("[Godcandle] Wallet resolution error:", e);
    }
  }, [username]);

  useEffect(() => {
    resolve();

    // Re-check bio after hydration in case DOM bio rendered late
    const t1 = setTimeout(resolve, 1000);
    const t2 = setTimeout(resolve, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [resolve]);

  const { profile, loading, error, refresh } = useTraderProfile(walletAddress);

  // WebSocket subscription for instant updates on active profile
  useLiveUpdates(walletAddress, refresh);

  const handleManualLink = async (addr: string) => {
    await saveUserMapping(username, {
      address: addr,
      exchange: "hyperliquid",
      enabled: true
    });
    setWalletAddress(addr);
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px", boxSizing: "border-box", padding: "0 16px", margin: "12px 0" }}>
      <GodcandleCard
        username={username}
        walletAddress={walletAddress}
        profile={profile}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onConnectWallet={handleManualLink}
      />
    </div>
  );
};

// Container and Shadow DOM injection manager
let currentMountedContainer: HTMLElement | null = null;
let currentReactRoot: ReturnType<typeof createRoot> | null = null;
let lastHandledPath = "";

function cleanupCurrentContainer() {
  if (currentReactRoot) {
    try {
      currentReactRoot.unmount();
    } catch (e) {
      // Ignore unmount errors if DOM was already detached
    }
    currentReactRoot = null;
  }
  if (currentMountedContainer) {
    currentMountedContainer.remove();
    currentMountedContainer = null;
  }
  const strayRoot = document.getElementById("godcandle-extension-root");
  if (strayRoot) {
    strayRoot.remove();
  }
}

function findInsertionTarget(): { target: Element; method: "after" | "before" | "append" } | null {
  // Mount INSIDE the profile header container itself, right at the bottom
  // of the profile header (directly after the bio / header items / followers info),
  // as the last child of the profile header card, so it is permanently part of
  // the profile header, NOT the feed or tablist!

  // Primary: Target the profile details container that holds UserName, UserDescription, UserProfileHeader_Items
  const headerItems = document.querySelector('[data-testid="UserProfileHeader_Items"]');
  const userDescription = document.querySelector('[data-testid="UserDescription"]');
  const userName = document.querySelector('[data-testid="UserName"]');

  // Find common parent container that groups profile details
  const profileDetailsContainer =
    headerItems?.parentElement ||
    userDescription?.parentElement ||
    userName?.parentElement;

  if (profileDetailsContainer) {
    return { target: profileDetailsContainer, method: "append" };
  }

  // Target 2: Followers you follow or Following count row wrapper
  const followersYouFollow =
    document.querySelector('a[href*="/followers_you_follow"]') ||
    document.querySelector('a[aria-label*="Followers you know" i]');
  if (followersYouFollow) {
    const wrapper =
      followersYouFollow.closest('div[class*="r-1s2bzr4"]') ||
      followersYouFollow.closest('div[class*="r-bt1l66"]') ||
      followersYouFollow.parentElement?.parentElement;
    if (wrapper && wrapper.parentElement) {
      return { target: wrapper, method: "after" };
    }
  }

  const followingLink =
    document.querySelector('a[href$="/following"]') ||
    document.querySelector('a[href*="/verified_followers"]') ||
    document.querySelector('a[href$="/followers"]');
  if (followingLink) {
    const rowContainer =
      followingLink.closest('div[class*="r-1s2bzr4"]') ||
      followingLink.closest('div[class*="r-13awgt0"]') ||
      followingLink.parentElement?.parentElement;
    if (rowContainer && rowContainer.parentElement) {
      return { target: rowContainer, method: "after" };
    }
  }

  // Target 3: UserProfileHeader or primaryColumn fallback
  const primaryCol = document.querySelector('[data-testid="primaryColumn"]');
  if (primaryCol) {
    const headerSection = primaryCol.querySelector('div[data-testid="UserProfileHeader"]');
    if (headerSection) {
      return { target: headerSection, method: "append" };
    }
  }

  // Target 4: Immediately before the timeline tabs container if profile header details were not yet rendered
  const tabList = (primaryCol || document).querySelector('[role="tablist"]');
  if (tabList) {
    const tabsContainer =
      tabList.closest('div[style*="position: sticky"]') ||
      tabList.closest('div[data-testid="ScrollSnap-List"]') ||
      tabList.closest('div.r-14lw9ot') ||
      tabList;

    if (tabsContainer && tabsContainer.parentElement) {
      return { target: tabsContainer, method: "before" };
    }
  }

  return null;
}

function injectGodcandle() {
  const path = window.location.pathname;

  // Strict route check: MUST be strictly /<username>
  const match = path.match(/^\/([a-zA-Z0-9_]+)$/);

  // Reserved non-profile root paths on X
  const reservedPaths = new Set([
    "home",
    "explore",
    "notifications",
    "messages",
    "bookmarks",
    "settings",
    "i",
    "search",
    "compose",
    "login",
    "signup",
    "lists",
    "communities",
    "premium",
    "verified",
    "jobs",
    "about",
    "tos",
    "privacy"
  ]);

  if (!match || reservedPaths.has(match[1].toLowerCase())) {
    // We are on /about, /followers, /status/123, /home, etc. -> remove container
    cleanupCurrentContainer();
    lastHandledPath = path;
    return;
  }

  const rawUsername = match[1];

  // If already mounted on current path and DOM element is still connected to document body, nothing to do
  if (lastHandledPath === path && currentMountedContainer && document.body.contains(currentMountedContainer)) {
    return;
  }

  const insertion = findInsertionTarget();
  if (!insertion) {
    return;
  }

  lastHandledPath = path;

  // Clean old container if any
  cleanupCurrentContainer();

  // Create isolated container
  const container = document.createElement("div");
  container.id = "godcandle-extension-root";
  container.style.width = "100%";
  container.style.display = "block";
  container.style.marginTop = "12px";
  container.style.marginBottom = "12px";
  container.style.boxSizing = "border-box";
  container.style.zIndex = "10";

  // Use Shadow DOM to isolate styles completely
  const shadow = container.attachShadow({ mode: "open" });
  const mountPoint = document.createElement("div");
  mountPoint.style.width = "100%";
  mountPoint.style.display = "flex";
  mountPoint.style.justifyContent = "center";
  shadow.appendChild(mountPoint);

  // Insert relative to target
  try {
    if (insertion.method === "after") {
      insertion.target.insertAdjacentElement("afterend", container);
    } else if (insertion.method === "before") {
      insertion.target.insertAdjacentElement("beforebegin", container);
    } else {
      insertion.target.appendChild(container);
    }
    console.log("[Godcandle] Injected into profile header successfully", container);
  } catch (err) {
    console.warn("[Godcandle] Failed to insert container into target:", err);
    return;
  }

  currentMountedContainer = container;

  const root = createRoot(mountPoint);
  currentReactRoot = root;
  root.render(<ExtensionCardWrapper username={rawUsername} />);
}

// Observe URL and DOM changes (Twitter / X SPA navigation)
const observer = new MutationObserver(() => {
  const currentPath = window.location.pathname;
  if (currentPath !== lastHandledPath || !currentMountedContainer || !document.body.contains(currentMountedContainer)) {
    injectGodcandle();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Interval check every 500ms to guarantee re-injection if React 18 concurrent timeline hydration replaces DOM nodes
setInterval(() => {
  const path = window.location.pathname;
  const match = path.match(/^\/([a-zA-Z0-9_]+)$/);
  if (match) {
    const existing = document.getElementById("godcandle-extension-root");
    if (!currentMountedContainer || !document.body.contains(currentMountedContainer) || !existing) {
      injectGodcandle();
    }
  } else if (currentMountedContainer || document.getElementById("godcandle-extension-root")) {
    injectGodcandle();
  }
}, 500);

// Run periodically on load and early transitions
window.addEventListener("load", injectGodcandle);
setTimeout(injectGodcandle, 300);
setTimeout(injectGodcandle, 800);
setTimeout(injectGodcandle, 1500);
setTimeout(injectGodcandle, 3000);
setTimeout(injectGodcandle, 5000);
