import { useCallback, useState } from "react";

const AUTO_EXPAND_PHASES = new Set(["intake", "negotiation", "review_halt"]);

export function useAssistantDrawer({ phase, openTicketCount, hasError }) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  const shouldAutoExpand =
    AUTO_EXPAND_PHASES.has(phase) || openTicketCount > 0 || hasError;

  // Adjust `expanded` when shouldAutoExpand/pinned change, without a
  // useEffect round-trip -- this is React's documented pattern for
  // "adjusting state when a prop changes" during render:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // Seed with `null` (never a real key, which is always "<bool>:<bool>") so
  // the check below always runs on mount too -- matching the original
  // useEffect, which always fires once after the initial render regardless
  // of the starting values.
  const autoExpandKey = `${shouldAutoExpand}:${pinned}`;
  const [prevAutoExpandKey, setPrevAutoExpandKey] = useState(null);
  if (autoExpandKey !== prevAutoExpandKey) {
    setPrevAutoExpandKey(autoExpandKey);
    if (shouldAutoExpand && !pinned) {
      setExpanded(true);
    }
  }

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
