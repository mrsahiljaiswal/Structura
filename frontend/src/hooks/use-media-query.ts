import * as React from "react";

/**
 * Example custom hook, included to establish the `src/hooks` convention.
 * Add feature hooks here (e.g. use-debounce, use-auth, use-*-query wrappers).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = () => setMatches(mediaQueryList.matches);

    listener();
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
