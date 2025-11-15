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

import { useState, useEffect } from 'react';

// Type-only imports to avoid bundling issues
import type { 
  NavigatorCore as NavigatorCoreType, 
  NavigatorCoreConfig, 
  INavigatorPlugin 
} from '@navigator.menu/core';

export interface UseNavigatorOptions extends NavigatorCoreConfig {
  /** Whether to automatically start the core after initialization (default: true) */
  autoStart?: boolean;
  /** Plugins to register before initialization */
  plugins?: INavigatorPlugin[];
}

export interface UseNavigatorReturn {
  /** The NavigatorCore instance (null until initialized) */
  core: NavigatorCoreType | null;
}

export function useNavigator(config?: UseNavigatorOptions): UseNavigatorReturn {
  const [core, setCore] = useState<NavigatorCoreType | null>(null);
  const { autoStart = true, plugins = [], ...coreConfig } = config || {};

  useEffect(() => {
    let isSubscribed = true;

    // Dynamically import NavigatorCore to avoid SSR issues
    import('@navigator.menu/core').then(async ({ NavigatorCore }) => {
      if (!isSubscribed) return;

      // Create the core
      const newCore = new NavigatorCore(coreConfig);

      // Register plugins before initialization
      for (const plugin of plugins) {
        newCore.registerPlugin(plugin);
      }

      // Initialize the core (this will init all registered plugins)
      await newCore.init();

      // Auto-start if enabled
      if (autoStart) {
        await newCore.start();
      }

      if (isSubscribed) {
        setCore(newCore);
      }
    });

    // Cleanup on unmount
    return () => {
      isSubscribed = false;
      if (core) {
        core.destroy();
      }
    };
  }, []); // Empty deps - only run once

  return { core };
}
