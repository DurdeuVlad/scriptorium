import { useCallback, useEffect, useState } from "react";

const AUTO_EXPAND_PHASES = new Set(["intake", "negotiation", "review_halt"]);

export function useAssistantDrawer({ phase, openTicketCount, hasError }) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  const shouldAutoExpand =
    AUTO_EXPAND_PHASES.has(phase) || openTicketCount > 0 || hasError;

  useEffect(() => {
    if (shouldAutoExpand && !pinned) {
      setExpanded(true);
    }
  }, [shouldAutoExpand, pinned]);

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  const collapse = useCallback(() => {
    setExpanded(false);
    setPinned(false);
  }, []);

  const expand = useCallback(() => {
    setExpanded(true);
  }, []);

  const pinOpen = useCallback(() => {
    setExpanded(true);
    setPinned(true);
  }, []);

  return {
    expanded,
    pinned,
    toggle,
    collapse,
    expand,
    pinOpen,
    badgeCount: openTicketCount + (hasError ? 1 : 0),
  };
}
