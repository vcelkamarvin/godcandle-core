import { fetchTraderProfile } from "../services/hyperliquidDataProvider";
import { resolveWalletForProfile } from "../services/walletResolver";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Godcandle Chrome Extension installed.");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "RESOLVE_WALLET") {
    resolveWalletForProfile(message.username, message.bio)
      .then((res) => sendResponse({ success: true, data: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.type === "FETCH_TRADER_PROFILE") {
    fetchTraderProfile(message.address)
      .then((profile) => sendResponse({ success: true, data: profile }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
