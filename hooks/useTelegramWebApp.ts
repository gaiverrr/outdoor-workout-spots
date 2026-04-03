"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

export function useTelegramWebApp(): UseTelegramWebAppReturn {
  const [isTWA, setIsTWA] = useState(false);
  const webAppRef = useRef<TelegramWebApp | null>(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    // initData is non-empty only when running inside an actual Telegram client
    if (webApp && webApp.initData) {
      webAppRef.current = webApp;
      setIsTWA(true);
      webApp.ready();
      webApp.expand();
      document.documentElement.classList.add("twa");
    }
  }, []);

  const showBackButton = useCallback((callback: () => void) => {
    const webApp = webAppRef.current;
    if (!webApp) return;
    webApp.BackButton.onClick(callback);
    webApp.BackButton.show();
  }, []);

  const hideBackButton = useCallback(() => {
    const webApp = webAppRef.current;
    if (!webApp) return;
    webApp.BackButton.hide();
  }, []);

  return { isTWA, showBackButton, hideBackButton };
}
