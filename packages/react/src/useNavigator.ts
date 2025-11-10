/**
 * useNavigator.ts
 * 
 * React hook for Navigator.Menu integration - BYOS v0.1 (Bring Your Own State).
 * 
 * This minimal version focuses on lifecycle management only.
 * Users are responsible for their own state management and event subscriptions.
 * 
 * @example
 * ```tsx
 * function MyApp() {
 *   const [lastKey, setLastKey] = useState<string | null>(null);
 *   const { core } = useNavigator({
 *     plugins: [new KeyboardPlugin()]
 *   });
 * 
 *   useEffect(() => {
 *     if (!core) return;
 *     const unsubscribe = core.eventBus.on('keyboard:keydown', (event) => {
 *       setLastKey(event.key);
 *     });
 *     return unsubscribe;
 *   }, [core]);
 * 
 *   return <div>Last key: {lastKey}</div>;
 * }
 * ```
 */

import { useRef, useEffect } from 'react';
import type { NavigatorCore, NavigatorCoreConfig } from '@navigator.menu/core';

export interface UseNavigatorOptions extends NavigatorCoreConfig {
  /** Whether to automatically start the core after initialization (default: true) */
  autoStart?: boolean;
}

export interface UseNavigatorReturn {
  /** The NavigatorCore instance (null until initialized) */
  core: NavigatorCore | null;
}

export function useNavigator(config?: UseNavigatorOptions): UseNavigatorReturn {
  const coreRef = useRef<NavigatorCore | null>(null);
  const { autoStart = true, ...coreConfig } = config || {};

  useEffect(() => {
    // Dynamically import NavigatorCore to avoid SSR issues
    import('@navigator.menu/core').then(async ({ NavigatorCore }) => {
      // Create and initialize the core
      coreRef.current = new NavigatorCore(coreConfig);
      await coreRef.current.init();

      // Auto-start if enabled
      if (autoStart) {
        await coreRef.current.start();
      }
    });

    // Cleanup on unmount
    return () => {
      if (coreRef.current) {
        coreRef.current.destroy();
        coreRef.current = null;
      }
    };
  }, []); // Empty deps - only run once

  return { core: coreRef.current };
}
