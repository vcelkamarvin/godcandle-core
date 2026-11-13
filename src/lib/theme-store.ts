import { useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
}

const STORAGE_KEY = "quantin-theme";
const COOKIE_NAME = "quantin-theme";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

function resolveSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getInitialTheme(): ThemeChoice {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    const cookieVal = getCookie(COOKIE_NAME) as ThemeChoice | null;
    if (cookieVal === "light" || cookieVal === "dark" || cookieVal === "system") {
      return cookieVal;
    }
  } catch {
    // ignore storage access errors
  }
  return "light";
}

let currentTheme: ThemeChoice = getInitialTheme();
let currentResolved: ResolvedTheme =
  currentTheme === "system" ? resolveSystemTheme() : currentTheme;

let currentState: ThemeState = {
  theme: currentTheme,
  resolvedTheme: currentResolved,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

let transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;

function applyDomTheme(resolved: ResolvedTheme, animate = false) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (animate && !isReducedMotion) {
    if (transitionTimeoutId) {
      clearTimeout(transitionTimeoutId);
    }
    root.classList.add("theme-transition");
    transitionTimeoutId = setTimeout(() => {
      root.classList.remove("theme-transition");
      transitionTimeoutId = null;
    }, 200);
  }

  root.setAttribute("data-theme", resolved);
}

// Sync to user profile if Supabase is connected or local user session exists
async function syncProfileTheme(theme: ThemeChoice) {
  try {
    // 1. Local profile backup
    if (typeof localStorage !== "undefined") {
      const profileStr = localStorage.getItem("quantin-user-profile");
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          profile.theme = theme;
          localStorage.setItem("quantin-user-profile", JSON.stringify(profile));
        } catch {
          // ignore parse errors
        }
      }
    }

    // 2. Dynamic Supabase check (if global or injected client exists)
    const win =
      typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const winSb = win ? (win["supabase"] as any) : null;
    if (winSb && typeof winSb === "object") {
      const sb = winSb as {
        auth?: { getUser?: () => Promise<{ data?: { user?: { id?: string } } }> };
        from?: (table: string) => {
          update: (data: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<unknown>;
          };
        };
      };
      if (sb.auth?.getUser && sb.from) {
        const { data } = await sb.auth.getUser();
        if (data?.user?.id) {
          await sb.from("profiles").update({ theme }).eq("id", data.user.id);
        }
      }
    }
  } catch {
    // Silently ignore network or profile sync errors
  }
}

// Load saved theme from user's Supabase profile upon login
export async function loadProfileTheme(): Promise<ThemeChoice | null> {
  try {
    const win =
      typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const winSb = win ? (win["supabase"] as any) : null;
    if (winSb && typeof winSb === "object") {
      const sb = winSb as {
        auth?: { getUser?: () => Promise<{ data?: { user?: { id?: string } } }> };
        from?: (table: string) => {
          select: (cols: string) => {
            eq: (
              col: string,
              val: string,
            ) => {
              single: () => Promise<{ data?: { theme?: ThemeChoice } }>;
            };
          };
        };
      };
      if (sb.auth?.getUser && sb.from) {
        const { data: authData } = await sb.auth.getUser();
        if (authData?.user?.id) {
          const { data: profile } = await sb
            .from("profiles")
            .select("theme")
            .eq("id", authData.user.id)
            .single();
          if (
            profile?.theme &&
            (profile.theme === "light" || profile.theme === "dark" || profile.theme === "system")
          ) {
            themeStore.setTheme(profile.theme, true);
            return profile.theme;
          }
        }
      }
    }

    if (typeof localStorage !== "undefined") {
      const profileStr = localStorage.getItem("quantin-user-profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (
          profile?.theme &&
          (profile.theme === "light" || profile.theme === "dark" || profile.theme === "system")
        ) {
          themeStore.setTheme(profile.theme, true);
          return profile.theme;
        }
      }
    }
  } catch {
    // Silently ignore profile load errors
  }
  return null;
}

// System listener for OS dark mode changes
if (typeof window !== "undefined" && window.matchMedia) {
  try {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (currentTheme === "system") {
        const newResolved: ResolvedTheme = e.matches ? "dark" : "light";
        if (newResolved !== currentResolved) {
          currentResolved = newResolved;
          currentState = {
            theme: currentTheme,
            resolvedTheme: currentResolved,
          };
          applyDomTheme(currentResolved, true);
          notify();
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else if ("addListener" in mediaQuery) {
      // Compatibility for older Safari
      (
        mediaQuery as unknown as { addListener: (cb: (e: MediaQueryList) => void) => void }
      ).addListener(handleSystemChange);
    }
  } catch {
    // ignore media query errors
  }
}

export const themeStore = {
  getTheme(): ThemeChoice {
    return currentTheme;
  },

  getResolvedTheme(): ResolvedTheme {
    return currentResolved;
  },

  getState(): ThemeState {
    return currentState;
  },

  setTheme(newTheme: ThemeChoice, animate = true) {
    if (newTheme !== "light" && newTheme !== "dark" && newTheme !== "system") {
      newTheme = "system";
    }

    const prevResolved = currentResolved;
    currentTheme = newTheme;
    currentResolved = newTheme === "system" ? resolveSystemTheme() : newTheme;
    currentState = {
      theme: currentTheme,
      resolvedTheme: currentResolved,
    };

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      setCookie(COOKIE_NAME, newTheme);
    } catch {
      // storage quota / security errors
    }

    applyDomTheme(currentResolved, animate && prevResolved !== currentResolved);
    syncProfileTheme(newTheme);
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

const SERVER_SNAPSHOT: ThemeState = {
  theme: "light",
  resolvedTheme: "light",
};

const getServerSnapshot = () => SERVER_SNAPSHOT;

export function useTheme(): {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
} {
  const state = useSyncExternalStore(themeStore.subscribe, themeStore.getState, getServerSnapshot);

  return {
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    setTheme: (t: ThemeChoice) => themeStore.setTheme(t, true),
  };
}
