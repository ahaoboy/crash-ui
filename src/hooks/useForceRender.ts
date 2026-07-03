import { useReducer } from "react";

// Re-render pulse used by singleton stores that store state outside React.
export function useForceRender(): () => void {
  const [, dispatch] = useReducer((n: number) => n + 1, 0);
  return () => {
    dispatch();
  };
}
