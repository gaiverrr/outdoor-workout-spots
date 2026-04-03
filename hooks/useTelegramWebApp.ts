"use client";

import { useEffect, useCallback, useRef, useSyncExternalStore } from "react";

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  themeParams: Record<string, string>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface UseTelegramWebAppReturn {
  isTWA: boolean;
  showBackButton: (callback: () => void) => void;
  hideBackButton: () => void;
}

function getIsTWA(): boolean {
  if (typeof window === "undefined") return false;
  const webApp = window.Telegram?.WebApp;
  return !!(webApp && webApp.initData);
}

function subscribe() {
  // TWA status never changes after page load — no-op subscriber
  return () => {};
}

export function useTelegramWebApp(): UseTelegramWebAppReturn {
  const isTWA = useSyncExternalStore(subscribe, getIsTWA, () => false);
  const webAppRef = useRef<TelegramWebApp | null>(null);
  const callbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp && webApp.initData) {
      webAppRef.current = webApp;
      webApp.ready();
      webApp.expand();
      document.documentElement.classList.add("twa");
    }
  }, []);

  const showBackButton = useCallback((callback: () => void) => {
    const webApp = webAppRef.current;
    if (!webApp) return;
    if (callbackRef.current) {
      webApp.BackButton.offClick(callbackRef.current);
    }
    callbackRef.current = callback;
    webApp.BackButton.onClick(callback);
    webApp.BackButton.show();
  }, []);

  const hideBackButton = useCallback(() => {
    const webApp = webAppRef.current;
    if (!webApp) return;
    if (callbackRef.current) {
      webApp.BackButton.offClick(callbackRef.current);
      callbackRef.current = null;
    }
    webApp.BackButton.hide();
  }, []);

  return { isTWA, showBackButton, hideBackButton };
}
