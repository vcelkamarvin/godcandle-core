const INFO_ENDPOINT = "https://api.hyperliquid.xyz/info";

export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<unknown>>();

export async function hlInfo<T>(
  body: Record<string, unknown>,
  retries = 3,
  backoffMs = 500
): Promise<T> {
  const requestKey = JSON.stringify(body);
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<T>;
  }

  const promise = (async () => {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(INFO_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: requestKey,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Hyperliquid API HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (err: unknown) {
        attempt++;
        if (attempt > retries) {
          throw err;
        }
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error("Hyperliquid request failed after retries");
  })().finally(() => {
    pendingRequests.delete(requestKey);
  });

  pendingRequests.set(requestKey, promise);
  return promise;
}
