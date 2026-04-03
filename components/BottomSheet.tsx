"use client";

import { useCallback, useRef, useState, useEffect } from "react";

type SheetState = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  spotCount?: number;
}

const PEEK_HEIGHT = 72;
const HALF_RATIO = 0.5;
const FULL_RATIO = 0.9;

export function BottomSheet({ children, header, spotCount = 0 }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("peek");
  const [dragging, setDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const getHeightForState = useCallback((s: SheetState): number => {
    const vh = window.innerHeight;
    switch (s) {
      case "peek": return PEEK_HEIGHT;
      case "half": return vh * HALF_RATIO;
      case "full": return vh * FULL_RATIO;
    }
  }, []);

  const getTranslateForState = useCallback(
    (s: SheetState): number => {
      const vh = window.innerHeight;
      const height = getHeightForState(s);
      return vh - height;
    },
    [getHeightForState]
  );

  useEffect(() => {
    setTranslateY(getTranslateForState("peek"));
  }, [getTranslateForState]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setDragging(true);
      dragStartY.current = e.touches[0].clientY;
      dragStartTranslate.current = translateY;
    },
    [translateY]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging) return;
      const diff = e.touches[0].clientY - dragStartY.current;
      const newTranslate = dragStartTranslate.current + diff;
      const minTranslate = getTranslateForState("full");
      const maxTranslate = getTranslateForState("peek");
      setTranslateY(Math.max(minTranslate, Math.min(maxTranslate, newTranslate)));
    },
    [dragging, getTranslateForState]
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    const vh = window.innerHeight;
    const currentHeight = vh - translateY;

    const peekH = PEEK_HEIGHT;
    const halfH = vh * HALF_RATIO;
    const fullH = vh * FULL_RATIO;

    const distPeek = Math.abs(currentHeight - peekH);
    const distHalf = Math.abs(currentHeight - halfH);
    const distFull = Math.abs(currentHeight - fullH);

    const min = Math.min(distPeek, distHalf, distFull);
    let target: SheetState;
    if (min === distPeek) target = "peek";
    else if (min === distHalf) target = "half";
    else target = "full";

    setState(target);
    setTranslateY(getTranslateForState(target));
  }, [translateY, getTranslateForState]);

  return (
    <div
      ref={sheetRef}
      className={`md:hidden fixed inset-x-0 bottom-0 z-20 bg-app border-t border-border rounded-t-2xl flex flex-col
        ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
      style={{
        transform: `translateY(${translateY}px)`,
        height: "90vh",
      }}
      data-testid="bottom-sheet"
      data-state={state}
    >
      <div
        className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="bottom-sheet-handle"
      >
        <div className="w-10 h-1 bg-border-hover rounded-full mb-2" />
        <span className="text-xs text-text-dim">
          {spotCount} spots nearby
        </span>
      </div>

      {header && (
        <div className="px-3 pb-2 border-b border-border flex-shrink-0">{header}</div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-safe-bottom min-h-0" data-testid="bottom-sheet-content">
        {children}
      </div>
    </div>
  );
}
