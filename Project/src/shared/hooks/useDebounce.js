import { useEffect, useState } from 'react';

/**
 * Returns the latest `value` after it has stayed unchanged for `delayMs`.
 * Used to throttle network calls bound to text input.
 */
export default function useDebounce(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
