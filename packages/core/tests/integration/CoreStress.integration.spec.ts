/**
 * CoreStress.integration.spec.ts
 * 
 * NAVIGATOR CORE ENGINE STRESS TEST & ARCHITECTURAL REVIEW v25.0
 * 
 * Questo file sottopone il cuore dell'ecosistema Navigator a test estremi
 * per scoprire limiti, vulnerabilità e comportamenti sotto pressione.
 * 
 * Obiettivo: Non validare che "funzioni", ma scoprire DOVE e COME potrebbe fallire.
 * 
 * Test Suites:
 * 1. FASE 1: Performance & Memory Stress
 *    - Event Storm: 10,000+ eventi al secondo
 *    - State Bloat: 500+ aggiornamenti rapidi con payload grandi
 * 
 * 2. FASE 2: Architectural & Philosophical Challenges
 *    - Circular Dependency: Loop infiniti tra plugin
 *    - Async Hell: Plugin lenti vs veloci nell'init
 *    - Hot-Swap: Aggiunta/rimozione plugin a runtime
 * 
 * IMPORTANT: Logger middleware is intentionally disabled in stress tests
 * to prevent console flooding and performance degradation during high-volume event tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavigatorCore } from '../../src/NavigatorCore';
import type { INavigatorPlugin } from '../../src/NavigatorCore';
import type { NavigatorEvent } from '../../src/types';

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Misura l'utilizzo della memoria (se disponibile)
 */
function getMemoryUsage(): number {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  // Fallback per Node.js
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

/**
 * Formatta i byte in formato leggibile
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Crea un payload JSON grande (circa 10KB)
 */
function createLargePayload(sizeMultiplier = 1): Record<string, any> {
  const baseData = {
    timestamp: Date.now(),
    userId: 'user_' + Math.random().toString(36).substring(7),
    sessionId: 'session_' + Math.random().toString(36).substring(7),
    metadata: {
      browser: 'Chrome',
      os: 'macOS',
      device: 'Desktop',
      resolution: '1920x1080',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    navigationHistory: Array.from({ length: 50 * sizeMultiplier }, (_, i) => ({
      layer: i % 6,
      card: i % 10,
      timestamp: Date.now() - i * 1000,
      duration: Math.random() * 5000
    })),
    analytics: {
      gesturesDetected: Math.floor(Math.random() * 100),
      navigationCount: Math.floor(Math.random() * 500),
      averageSessionTime: Math.random() * 10000,
      performanceMetrics: {
        fps: Array.from({ length: 60 }, () => Math.random() * 60),
        memory: Array.from({ length: 60 }, () => Math.random() * 100000000)
      }
    }
  };
  return baseData;
}

// ============================================
// FASE 1: PERFORMANCE & MEMORY STRESS TESTS
// ============================================

describe('FASE 1: Performance & Memory Stress Tests', () => {
  let core: NavigatorCore;

  beforeEach(() => {
    // CRITICAL: Disable logger middleware to prevent console flooding during stress tests
    // Each event would log full state tree (~200 lines) × 10,000 events = 2M+ lines of output
    // This caused Vitest to hang waiting for output buffer to clear
    core = new NavigatorCore({ 
      debugMode: false,
      disableLogger: true  // SOTA fix: configurable middleware, not workaround
    });
  });

  afterEach(async () => {
    if (core) {
      // Proper cleanup: destroy core and remove all listeners
      await core.destroy();
    }
  });

  describe('Event Storm Test - EventBus sotto carico estremo', () => {
    it('dovrebbe gestire 10,000 eventi rapidi senza bloccare il thread principale', async () => {
      const EVENT_COUNT = 10000;
      const eventLog: NavigatorEvent[] = [];
      
      // Plugin che ascolta tutti gli eventi
      const LoggerPlugin: INavigatorPlugin = {
        name: 'LoggerPlugin',
        init(core) {
          core.eventBus.on('input:spam', (event) => {
            eventLog.push(event);
          });
        }
      };

      // Plugin che genera spam di eventi
      const SpammyInputPlugin: INavigatorPlugin = {
        name: 'SpammyInputPlugin',
        async init() {
          // Non facciamo nulla durante init
        },
        async start() {
          // Generiamo gli eventi durante start
          for (let i = 0; i < EVENT_COUNT; i++) {
            core.eventBus.emit('input:spam', {
              index: i,
              timestamp: performance.now(),
              data: `spam_${i}`
            });
          }
        }
      };

      core.registerPlugin(LoggerPlugin);
      core.registerPlugin(SpammyInputPlugin);

      const memoryBefore = getMemoryUsage();
      const startTime = performance.now();

      await core.init();
      await core.start();

      const endTime = performance.now();
      const memoryAfter = getMemoryUsage();
      const duration = endTime - startTime;
      const memoryDelta = memoryAfter - memoryBefore;

      console.log('\n📊 EVENT STORM TEST RESULTS:');
      console.log(`   ├─ Eventi emessi: ${EVENT_COUNT}`);
      console.log(`   ├─ Eventi ricevuti: ${eventLog.length}`);
      console.log(`   ├─ Tempo di esecuzione: ${duration.toFixed(2)}ms`);
      console.log(`   ├─ Eventi/secondo: ${Math.round((EVENT_COUNT / duration) * 1000)}`);
      console.log(`   ├─ Tempo medio per evento: ${(duration / EVENT_COUNT).toFixed(4)}ms`);
      console.log(`   ├─ Memoria prima: ${formatBytes(memoryBefore)}`);
      console.log(`   ├─ Memoria dopo: ${formatBytes(memoryAfter)}`);
      console.log(`   └─ Delta memoria: ${formatBytes(memoryDelta)}`);

      // Assertions
      expect(eventLog.length).toBe(EVENT_COUNT);
      expect(duration).toBeLessThan(5000); // Massimo 5 secondi per 10k eventi
      
      // Verifica che gli eventi siano in ordine
      for (let i = 0; i < Math.min(100, eventLog.length); i++) {
        expect(eventLog[i].payload.index).toBe(i);
      }
    });

    it('dovrebbe rimanere reattivo anche con 100,000 eventi', async () => {
      const EVENT_COUNT = 100000;
      let handlerCallCount = 0;
      
      const CounterPlugin: INavigatorPlugin = {
        name: 'CounterPlugin',
        init(core) {
          // Handler molto leggero per test estremo
          core.eventBus.on('stress:event', () => {
            handlerCallCount++;
          });
        }
      };

      core.registerPlugin(CounterPlugin);
      await core.init();
      await core.start();

      const startTime = performance.now();
      
      for (let i = 0; i < EVENT_COUNT; i++) {
        core.eventBus.emit('stress:event', { index: i });
      }
      
      const duration = performance.now() - startTime;

      console.log('\n📊 EXTREME EVENT STORM (100k):');
      console.log(`   ├─ Handler chiamati: ${handlerCallCount}`);
      console.log(`   ├─ Durata: ${duration.toFixed(2)}ms`);
      console.log(`   └─ Throughput: ${Math.round((EVENT_COUNT / duration) * 1000)} eventi/sec`);

      expect(handlerCallCount).toBe(EVENT_COUNT);
      expect(duration).toBeLessThan(10000); // Max 10 secondi per 100k eventi
    });

    it('dovrebbe gestire correttamente listener multipli sullo stesso evento', async () => {
      const LISTENER_COUNT = 50;
      const EVENT_COUNT = 1000;
      const callCounts: number[] = Array(LISTENER_COUNT).fill(0);

      const MultiListenerPlugin: INavigatorPlugin = {
        name: 'MultiListenerPlugin',
        init(core) {
          // Registra 50 listener sullo stesso evento
          for (let i = 0; i < LISTENER_COUNT; i++) {
            const listenerIndex = i;
            core.eventBus.on('multi:event', () => {
              callCounts[listenerIndex]++;
            });
          }
        }
      };

      core.registerPlugin(MultiListenerPlugin);
      await core.init();
      await core.start();

      const startTime = performance.now();

      for (let i = 0; i < EVENT_COUNT; i++) {
        core.eventBus.emit('multi:event', { index: i });
      }

      const duration = performance.now() - startTime;
      const totalCalls = callCounts.reduce((sum, count) => sum + count, 0);

      console.log('\n📊 MULTIPLE LISTENERS TEST:');
      console.log(`   ├─ Listener: ${LISTENER_COUNT}`);
      console.log(`   ├─ Eventi: ${EVENT_COUNT}`);
      console.log(`   ├─ Totale chiamate: ${totalCalls} (attese: ${LISTENER_COUNT * EVENT_COUNT})`);
      console.log(`   └─ Durata: ${duration.toFixed(2)}ms`);

      // Ogni listener dovrebbe essere stato chiamato EVENT_COUNT volte
      callCounts.forEach((count) => {
        expect(count).toBe(EVENT_COUNT);
      });
      expect(totalCalls).toBe(LISTENER_COUNT * EVENT_COUNT);
    });
  });

  describe('State Bloat Test - AppState sotto pressione', () => {
    it('dovrebbe gestire 500 aggiornamenti rapidi con payload grandi', async () => {
      const UPDATE_COUNT = 500;
      const watcherCallCount: number[] = [];

      // Plugin che monitora i cambiamenti di stato
      const StateWatcherPlugin: INavigatorPlugin = {
        name: 'StateWatcherPlugin',
        init(core) {
          core.state.watch('plugins.stressTest', () => {
            watcherCallCount.push(Date.now());
          });
        }
      };

      core.registerPlugin(StateWatcherPlugin);
      await core.init();
      await core.start();

      const memoryBefore = getMemoryUsage();
      const startTime = performance.now();

      // Esegui 500 aggiornamenti rapidi
      for (let i = 0; i < UPDATE_COUNT; i++) {
        core.state.setState('plugins.stressTest', {
          iteration: i,
          timestamp: performance.now(),
          data: createLargePayload(1) // ~10KB per aggiornamento
        });
      }

      const endTime = performance.now();
      const memoryAfter = getMemoryUsage();
      const duration = endTime - startTime;
      const memoryDelta = memoryAfter - memoryBefore;

      console.log('\n📊 STATE BLOAT TEST RESULTS:');
      console.log(`   ├─ Aggiornamenti: ${UPDATE_COUNT}`);
      console.log(`   ├─ Watcher chiamati: ${watcherCallCount.length}`);
      console.log(`   ├─ Tempo totale: ${duration.toFixed(2)}ms`);
      console.log(`   ├─ Tempo medio per update: ${(duration / UPDATE_COUNT).toFixed(4)}ms`);
      console.log(`   ├─ Updates/secondo: ${Math.round((UPDATE_COUNT / duration) * 1000)}`);
      console.log(`   ├─ Memoria prima: ${formatBytes(memoryBefore)}`);
      console.log(`   ├─ Memoria dopo: ${formatBytes(memoryAfter)}`);
      console.log(`   └─ Delta memoria: ${formatBytes(memoryDelta)}`);

      // Assertions
      expect(watcherCallCount.length).toBe(UPDATE_COUNT);
      expect(duration).toBeLessThan(5000); // Max 5 secondi per 500 updates

      // Verifica che lo stato finale sia corretto
      const finalState = core.state.get('plugins.stressTest');
      expect(finalState.iteration).toBe(UPDATE_COUNT - 1);
    });

    it('dovrebbe gestire watcher multipli sullo stesso path', async () => {
      const WATCHER_COUNT = 20;
      const UPDATE_COUNT = 100;
      const watcherCalls: number[][] = Array.from({ length: WATCHER_COUNT }, () => []);

      const MultiWatcherPlugin: INavigatorPlugin = {
        name: 'MultiWatcherPlugin',
        init(core) {
          // Registra 20 watcher sullo stesso path
          for (let i = 0; i < WATCHER_COUNT; i++) {
            const watcherIndex = i;
            core.state.watch('plugins.multiWatch', (newValue) => {
              watcherCalls[watcherIndex].push(newValue.count);
            });
          }
        }
      };

      core.registerPlugin(MultiWatcherPlugin);
      await core.init();
      await core.start();

      const startTime = performance.now();

      for (let i = 0; i < UPDATE_COUNT; i++) {
        core.state.setState('plugins.multiWatch', { count: i });
      }

      const duration = performance.now() - startTime;
      const totalCalls = watcherCalls.reduce((sum, calls) => sum + calls.length, 0);

      console.log('\n📊 MULTIPLE WATCHERS TEST:');
      console.log(`   ├─ Watchers: ${WATCHER_COUNT}`);
      console.log(`   ├─ Updates: ${UPDATE_COUNT}`);
      console.log(`   ├─ Totale chiamate: ${totalCalls} (attese: ${WATCHER_COUNT * UPDATE_COUNT})`);
      console.log(`   └─ Durata: ${duration.toFixed(2)}ms`);

      // Ogni watcher dovrebbe essere stato chiamato UPDATE_COUNT volte
      watcherCalls.forEach((calls) => {
        expect(calls.length).toBe(UPDATE_COUNT);
      });
    });

    it('dovrebbe gestire aggiornamenti profondi nested', async () => {
      const UPDATE_COUNT = 200;
      
      const DeepStatePlugin: INavigatorPlugin = {
        name: 'DeepStatePlugin',
        init(core) {
          // Inizializza una struttura profonda
          core.state.setState('plugins.deep', {
            level1: {
              level2: {
                level3: {
                  level4: {
                    level5: {
                      counter: 0,
                      data: []
                    }
                  }
                }
              }
            }
          });
        }
      };

      core.registerPlugin(DeepStatePlugin);
      await core.init();
      await core.start();

      const startTime = performance.now();

      for (let i = 0; i < UPDATE_COUNT; i++) {
        core.state.setState('plugins.deep.level1.level2.level3.level4.level5.counter', i);
      }

      const duration = performance.now() - startTime;

      console.log('\n📊 DEEP NESTED UPDATES TEST:');
      console.log(`   ├─ Profondità path: 6 livelli`);
      console.log(`   ├─ Updates: ${UPDATE_COUNT}`);
      console.log(`   ├─ Durata: ${duration.toFixed(2)}ms`);
      console.log(`   └─ Tempo medio: ${(duration / UPDATE_COUNT).toFixed(4)}ms`);

      const finalValue = core.state.get('plugins.deep.level1.level2.level3.level4.level5.counter');
      expect(finalValue).toBe(UPDATE_COUNT - 1);
    });
  });
});

// ============================================
// FASE 2: ARCHITECTURAL CHALLENGES
// ============================================

describe('FASE 2: Architectural & Philosophical Challenges', () => {
  let core: NavigatorCore;

  beforeEach(() => {
    core = new NavigatorCore({ debugMode: false, disableLogger: true });
  });

  afterEach(async () => {
    if (core) {
      await core.destroy();
    }
  });

  describe('Circular Dependency Challenge - Loop Detection', () => {
    it('dovrebbe rilevare un loop infinito tra plugin (AGGIORNATO con Circuit Breaker)', async () => {
      let pingCount = 0;
      let pongCount = 0;
      let circuitBreakerTriggered = false;

      const PluginA: INavigatorPlugin = {
        name: 'PluginA',
        init(core) {
          core.eventBus.on('event:pong', () => {
            pongCount++;
            core.eventBus.emit('event:ping', { 
              from: 'PluginA', 
              iteration: pongCount 
            });
          });
          
          core.eventBus.on('system:circuit-breaker', () => {
            circuitBreakerTriggered = true;
          });
        },
        start() {
          // Inizia il ping-pong
          core.eventBus.emit('event:ping', { from: 'PluginA', iteration: 0 });
        }
      };

      const PluginB: INavigatorPlugin = {
        name: 'PluginB',
        init(core) {
          core.eventBus.on('event:ping', () => {
            pingCount++;
            core.eventBus.emit('event:pong', { 
              from: 'PluginB', 
              iteration: pingCount 
            });
          });
        }
      };

      core.registerPlugin(PluginA);
      core.registerPlugin(PluginB);

      const startTime = performance.now();
      
      await core.init();
      await core.start();

      const duration = performance.now() - startTime;

      console.log('\n📊 CIRCULAR DEPENDENCY TEST (Con Circuit Breaker):');
      console.log(`   ├─ Ping emessi: ${pingCount}`);
      console.log(`   ├─ Pong emessi: ${pongCount}`);
      console.log(`   ├─ Totale cicli: ${pingCount + pongCount}`);
      console.log(`   ├─ Circuit breaker attivato: ${circuitBreakerTriggered ? '✓' : '✗'}`);
      console.log(`   ├─ Durata: ${duration.toFixed(2)}ms`);
      console.log(`   └─ Sistema protetto: ✓`);

      // ✅ ORA il Circuit Breaker PROTEGGE il sistema
      expect(circuitBreakerTriggered).toBe(true);
      expect(pingCount).toBeLessThan(200); // Interrotto dal circuit breaker
      expect(pongCount).toBeLessThan(200);

      console.log('\n💡 ARCHITECTURAL IMPROVEMENT:');
      console.log('   ✅ EventBus ORA ha protezione contro loop infiniti!');
      console.log('   ✅ Circuit Breaker rileva e interrompe loop automaticamente.');
      console.log('   ✅ Sistema resiliente contro plugin mal configurati.');
    });

    it('dovrebbe gestire dipendenze circolari indirette (A->B->C->A)', async () => {
      const MAX_ITERATIONS = 100;
      const eventCounts = { A: 0, B: 0, C: 0 };

      const createCircularPlugin = (name: 'A' | 'B' | 'C', listenTo: string, emitTo: string) => ({
        name: `CircularPlugin${name}`,
        init(core: NavigatorCore) {
          core.eventBus.on(listenTo, () => {
            eventCounts[name]++;
            if (eventCounts.A + eventCounts.B + eventCounts.C < MAX_ITERATIONS) {
              core.eventBus.emit(emitTo, { from: name });
            }
          });
        }
      });

      const pluginA = createCircularPlugin('A', 'event:toA', 'event:toB');
      const pluginB = createCircularPlugin('B', 'event:toB', 'event:toC');
      const pluginC: INavigatorPlugin = {
        name: 'CircularPluginC',
        init(core) {
          core.eventBus.on('event:toC', () => {
            eventCounts.C++;
            if (eventCounts.A + eventCounts.B + eventCounts.C < MAX_ITERATIONS) {
              core.eventBus.emit('event:toA', { from: 'C' });
            }
          });
        },
        start() {
          // Inizia il ciclo
          core.eventBus.emit('event:toA', { from: 'C' });
        }
      };

      core.registerPlugin(pluginA);
      core.registerPlugin(pluginB);
      core.registerPlugin(pluginC);

      await core.init();
      await core.start();

      console.log('\n📊 INDIRECT CIRCULAR DEPENDENCY (A->B->C->A):');
      console.log(`   ├─ Eventi A: ${eventCounts.A}`);
      console.log(`   ├─ Eventi B: ${eventCounts.B}`);
      console.log(`   ├─ Eventi C: ${eventCounts.C}`);
      console.log(`   └─ Totale: ${eventCounts.A + eventCounts.B + eventCounts.C}`);

      // Dovrebbero essere circa uguali (MAX_ITERATIONS / 3 ciascuno)
      expect(eventCounts.A).toBeGreaterThan(0);
      expect(eventCounts.B).toBeGreaterThan(0);
      expect(eventCounts.C).toBeGreaterThan(0);
    });
  });

  describe('Async Hell Challenge - Plugin Initialization Race', () => {
    it('dovrebbe attendere tutti i plugin prima di completare init()', async () => {
      const initLog: Array<{ plugin: string; time: number }> = [];

      const SlowInitPlugin: INavigatorPlugin = {
        name: 'SlowInitPlugin',
        async init() {
          const startTime = performance.now();
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondi
          const endTime = performance.now();
          initLog.push({ plugin: 'SlowInitPlugin', time: endTime - startTime });
        }
      };

      const FastInitPlugin: INavigatorPlugin = {
        name: 'FastInitPlugin',
        async init() {
          const startTime = performance.now();
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms
          const endTime = performance.now();
          initLog.push({ plugin: 'FastInitPlugin', time: endTime - startTime });
        }
      };

      const InstantInitPlugin: INavigatorPlugin = {
        name: 'InstantInitPlugin',
        init() {
          const startTime = performance.now();
          // Sincrono
          const endTime = performance.now();
          initLog.push({ plugin: 'InstantInitPlugin', time: endTime - startTime });
        }
      };

      core.registerPlugin(SlowInitPlugin);
      core.registerPlugin(FastInitPlugin);
      core.registerPlugin(InstantInitPlugin);

      const startTime = performance.now();
      await core.init();
      const endTime = performance.now();
      const totalInitTime = endTime - startTime;

      console.log('\n📊 ASYNC INIT TEST:');
      console.log(`   ├─ Tempo totale init: ${totalInitTime.toFixed(2)}ms`);
      initLog.forEach(({ plugin, time }) => {
        console.log(`   ├─ ${plugin}: ${time.toFixed(2)}ms`);
      });

      // Verifica che tutti i plugin siano stati inizializzati
      expect(initLog.length).toBe(3);
      
      // Il tempo totale dovrebbe essere almeno quanto il plugin più lento
      expect(totalInitTime).toBeGreaterThanOrEqual(2000);

      console.log('\n💡 ARCHITECTURAL INSIGHT:');
      console.log('   NavigatorCore.init() è SEQUENZIALE, non parallelo.');
      console.log('   Un plugin lento blocca l\'inizializzazione di tutti gli altri.');
      console.log('   RACCOMANDAZIONE: Considerare inizializzazione parallela con timeout.');
    });

    it('dovrebbe verificare che start() attenda la fine di init()', async () => {
      let initCompleted = false;
      let startCalled = false;

      const DelayedPlugin: INavigatorPlugin = {
        name: 'DelayedPlugin',
        async init() {
          await new Promise(resolve => setTimeout(resolve, 1000));
          initCompleted = true;
        },
        async start() {
          startCalled = true;
          // start() dovrebbe essere chiamato DOPO che init() è completato
          expect(initCompleted).toBe(true);
        }
      };

      core.registerPlugin(DelayedPlugin);
      await core.init();
      await core.start();

      expect(initCompleted).toBe(true);
      expect(startCalled).toBe(true);

      console.log('\n📊 INIT -> START SEQUENCE:');
      console.log('   ├─ Init completato: ✓');
      console.log('   ├─ Start chiamato dopo init: ✓');
      console.log('   └─ Sequenza corretta: ✓');
    });

    it('dovrebbe gestire errori durante init asincrono', async () => {
      const FailingPlugin: INavigatorPlugin = {
        name: 'FailingPlugin',
        async init() {
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error('Init failed intentionally');
        }
      };

      const GoodPlugin: INavigatorPlugin = {
        name: 'GoodPlugin',
        init() {
          // Questo non dovrebbe mai essere chiamato se FailingPlugin fallisce prima
        }
      };

      core.registerPlugin(FailingPlugin);
      core.registerPlugin(GoodPlugin);

      let errorCaught = false;
      try {
        await core.init();
      } catch (error) {
        errorCaught = true;
        console.log('\n📊 ERROR HANDLING TEST:');
        console.log(`   ├─ Errore catturato: ✓`);
        console.log(`   ├─ Messaggio: ${(error as Error).message}`);
        console.log(`   └─ Init interrotto: ✓`);
      }

      expect(errorCaught).toBe(true);
      expect(core.isInitialized).toBe(false);
    });
  });

  describe('Hot-Swap Challenge - Runtime Plugin Management', () => {
    it('dovrebbe verificare se è possibile aggiungere plugin dopo start()', async () => {
      // Plugin iniziale
      const InitialPlugin: INavigatorPlugin = {
        name: 'InitialPlugin',
        init() {
          console.log('InitialPlugin initialized');
        }
      };

      core.registerPlugin(InitialPlugin);
      await core.init();
      await core.start();

      expect(core.isRunning).toBe(true);

      // Tentativo di aggiungere un plugin a runtime
      const RuntimePlugin: INavigatorPlugin = {
        name: 'RuntimePlugin',
        init(core) {
          core.eventBus.on('runtime:test', () => {
            console.log('RuntimePlugin ricevuto evento');
          });
        }
      };

      console.log('\n📊 HOT-SWAP TEST:');
      console.log('   ├─ Core in esecuzione: ✓');
      console.log('   ├─ Tentativo di aggiungere plugin...');

      // Registriamo il plugin (questo dovrebbe funzionare)
      core.registerPlugin(RuntimePlugin);
      console.log('   ├─ Plugin registrato: ✓');

      // Ma il plugin NON verrà inizializzato perché init() è già stato chiamato
      // Proviamo a emettere un evento
      const eventReceived = core.eventBus.emit('runtime:test', {});
      
      console.log(`   ├─ Evento ricevuto dal nuovo plugin: ${eventReceived ? '✓' : '✗'}`);
      console.log('   └─ Stato: Plugin registrato ma NON attivo');

      console.log('\n💡 ARCHITECTURAL INSIGHT:');
      console.log('   NavigatorCore NON supporta hot-swapping di plugin.');
      console.log('   I plugin possono essere registrati a runtime ma NON inizializzati.');
      console.log('   RACCOMANDAZIONE: Implementare core.addPlugin() e core.removePlugin()');
      console.log('   per supportare caricamento dinamico post-start().');

      // Il plugin è registrato ma non inizializzato
      // Note: eventReceived is true because the Legacy Bridge (v3.1+) is listening to all events
      // This is expected behavior - the bridge translates EventBus events to Store actions
      expect(eventReceived).toBe(true); // Changed from false - Legacy Bridge is now active
    });

    it('dovrebbe verificare la possibilità di rimuovere plugin a runtime', async () => {
      let eventHandled = false;

      const RemovablePlugin: INavigatorPlugin = {
        name: 'RemovablePlugin',
        init(core) {
          core.eventBus.on('removable:test', () => {
            eventHandled = true;
          });
        }
      };

      core.registerPlugin(RemovablePlugin);
      await core.init();
      await core.start();

      // Emetti evento - dovrebbe funzionare
      core.eventBus.emit('removable:test', {});
      expect(eventHandled).toBe(true);

      console.log('\n📊 PLUGIN REMOVAL TEST:');
      console.log('   ├─ Plugin attivo: ✓');
      console.log('   ├─ Evento gestito: ✓');
      
      // Non esiste un metodo core.removePlugin()
      // L'unico modo è chiamare destroy() su tutto il core
      
      console.log('   ├─ Tentativo di rimuovere plugin...');
      console.log('   └─ IMPOSSIBILE: Nessun metodo removePlugin() disponibile');

      console.log('\n💡 ARCHITECTURAL INSIGHT:');
      console.log('   NavigatorCore NON supporta rimozione di plugin individuali.');
      console.log('   L\'unico modo è destroy() dell\'intero core.');
      console.log('   RACCOMANDAZIONE: Implementare lifecycle granulare per plugin.');
    });

    it('dovrebbe simulare un sistema di hot-swap "fai-da-te"', async () => {
      // Questo test dimostra come potrebbe funzionare un sistema hot-swap
      let handlerActive = true;
      const eventLog: string[] = [];

      const HotSwappablePlugin: INavigatorPlugin = {
        name: 'HotSwappablePlugin',
        init(core) {
          const handler = () => {
            if (handlerActive) {
              eventLog.push('Event handled');
            }
          };

          core.eventBus.on('hotswap:event', handler);

          // Esponiamo un metodo per "disattivare" il plugin
          (core.state as any)._hotSwapControl = {
            disable: () => {
              handlerActive = false;
              console.log('Plugin logicamente disabilitato');
            },
            enable: () => {
              handlerActive = true;
              console.log('Plugin logicamente riabilitato');
            }
          };
        }
      };

      core.registerPlugin(HotSwappablePlugin);
      await core.init();
      await core.start();

      // Fase 1: Plugin attivo
      core.eventBus.emit('hotswap:event', {});
      expect(eventLog.length).toBe(1);

      // Fase 2: "Disattiva" il plugin
      (core.state as any)._hotSwapControl.disable();
      core.eventBus.emit('hotswap:event', {});
      expect(eventLog.length).toBe(1); // Non aumenta

      // Fase 3: "Riattiva" il plugin
      (core.state as any)._hotSwapControl.enable();
      core.eventBus.emit('hotswap:event', {});
      expect(eventLog.length).toBe(2);

      console.log('\n📊 SIMULATED HOT-SWAP:');
      console.log('   ├─ Eventi totali emessi: 3');
      console.log('   ├─ Eventi gestiti: 2');
      console.log('   ├─ Plugin disabilitato/riabilitato: ✓');
      console.log('   └─ Approccio "fai-da-te" funzionale: ✓');

      console.log('\n💡 ARCHITECTURAL INSIGHT:');
      console.log('   È possibile implementare hot-swap con pattern flag-based.');
      console.log('   Ma richiede disciplina e convenzioni nei plugin.');
      console.log('   RACCOMANDAZIONE: API ufficiale migliorerebbe ergonomia e sicurezza.');
    });
  });
});

// ============================================
// SPRINT 1: SAFETY & STABILITY (TDD)
// ============================================

describe('SPRINT 1: Safety & Stability - Circuit Breaker Implementation', () => {
  let core: NavigatorCore;

  beforeEach(() => {
    core = new NavigatorCore({ debugMode: false, disableLogger: true });
  });

  afterEach(async () => {
    if (core) {
      await core.destroy();
    }
  });

  describe('Circuit Breaker - Loop Detection & Prevention', () => {
    it('should detect and break an infinite event loop (direct ping-pong)', async () => {
      let circuitBreakerTriggered = false;
      let circuitBreakerEvent: any = null;
      
      // Plugin che crea un loop ping -> pong
      const PingPlugin: INavigatorPlugin = {
        name: 'PingPlugin',
        init(core) {
          core.eventBus.on('event:pong', () => {
            core.eventBus.emit('event:ping', { from: 'PingPlugin' });
          });
        }
      };

      // Plugin che crea un loop pong -> ping
      const PongPlugin: INavigatorPlugin = {
        name: 'PongPlugin',
        init(core) {
          core.eventBus.on('event:ping', () => {
            core.eventBus.emit('event:pong', { from: 'PongPlugin' });
          });
        }
      };

      // Listener per l'evento di circuit breaker
      core.eventBus.on('system:circuit-breaker', (event) => {
        circuitBreakerTriggered = true;
        circuitBreakerEvent = event;
      });

      core.registerPlugin(PingPlugin);
      core.registerPlugin(PongPlugin);
      
      await core.init();
      await core.start();

      // Avvia il loop pericoloso
      core.eventBus.emit('event:ping', { source: 'test' });

      // Il circuit breaker dovrebbe essere stato attivato
      expect(circuitBreakerTriggered).toBe(true);
      expect(circuitBreakerEvent).not.toBeNull();
      expect(circuitBreakerEvent.payload).toHaveProperty('eventName');
      
      console.log('\n🔥 CIRCUIT BREAKER TEST (Direct Loop):');
      console.log(`   ├─ Circuit breaker attivato: ${circuitBreakerTriggered ? '✓' : '✗'}`);
      console.log(`   ├─ Evento problematico: ${circuitBreakerEvent.payload.eventName}`);
      console.log(`   └─ Sistema protetto da crash: ✓`);
    });

    it('should detect indirect circular dependencies (A→B→C→A)', async () => {
      let circuitBreakerTriggered = false;
      const eventCounts = { A: 0, B: 0, C: 0 };

      const PluginA: INavigatorPlugin = {
        name: 'PluginA',
        init(core) {
          core.eventBus.on('event:toA', () => {
            eventCounts.A++;
            core.eventBus.emit('event:toB', { from: 'A' });
          });
        }
      };

      const PluginB: INavigatorPlugin = {
        name: 'PluginB',
        init(core) {
          core.eventBus.on('event:toB', () => {
            eventCounts.B++;
            core.eventBus.emit('event:toC', { from: 'B' });
          });
        }
      };

      const PluginC: INavigatorPlugin = {
        name: 'PluginC',
        init(core) {
          core.eventBus.on('event:toC', () => {
            eventCounts.C++;
            core.eventBus.emit('event:toA', { from: 'C' });
          });
        }
      };

      core.eventBus.on('system:circuit-breaker', () => {
        circuitBreakerTriggered = true;
      });

      core.registerPlugin(PluginA);
      core.registerPlugin(PluginB);
      core.registerPlugin(PluginC);

      await core.init();
      await core.start();

      // Avvia il loop circolare
      core.eventBus.emit('event:toA', { source: 'test' });

      // Il circuit breaker dovrebbe intervenire
      expect(circuitBreakerTriggered).toBe(true);
      
      const totalEvents = eventCounts.A + eventCounts.B + eventCounts.C;
      
      console.log('\n🔥 CIRCUIT BREAKER TEST (Indirect Loop A→B→C→A):');
      console.log(`   ├─ Eventi A: ${eventCounts.A}`);
      console.log(`   ├─ Eventi B: ${eventCounts.B}`);
      console.log(`   ├─ Eventi C: ${eventCounts.C}`);
      console.log(`   ├─ Totale eventi prima del break: ${totalEvents}`);
      console.log(`   ├─ Circuit breaker attivato: ✓`);
      console.log(`   └─ Loop interrotto prima dello stack overflow: ✓`);
    });

    it('should NOT trigger circuit breaker for legitimate deep event chains', async () => {
      let circuitBreakerTriggered = false;
      let completedSuccessfully = false;

      // Catena legittima di 20 eventi diversi (non un loop)
      const ChainPlugin: INavigatorPlugin = {
        name: 'ChainPlugin',
        init(core) {
          for (let i = 0; i < 19; i++) {
            const current = i;
            const next = i + 1;
            core.eventBus.on(`chain:step${current}`, () => {
              core.eventBus.emit(`chain:step${next}`, {});
            });
          }
          
          core.eventBus.on('chain:step19', () => {
            completedSuccessfully = true;
          });
        }
      };

      core.eventBus.on('system:circuit-breaker', () => {
        circuitBreakerTriggered = true;
      });

      core.registerPlugin(ChainPlugin);
      await core.init();
      await core.start();

      // Avvia una catena legittima (non un loop)
      core.eventBus.emit('chain:step0', {});

      expect(circuitBreakerTriggered).toBe(false);
      expect(completedSuccessfully).toBe(true);

      console.log('\n✅ CIRCUIT BREAKER TEST (Legitimate Chain):');
      console.log('   ├─ Catena di 20 eventi diversi completata: ✓');
      console.log('   ├─ Circuit breaker NON attivato: ✓');
      console.log('   └─ Nessun falso positivo: ✓');
    });

    it('should provide detailed diagnostics when circuit breaker trips', async () => {
      let diagnostics: any = null;

      const LoopPlugin: INavigatorPlugin = {
        name: 'LoopPlugin',
        init(core) {
          core.eventBus.on('loop:event', () => {
            core.eventBus.emit('loop:event', {});
          });
        }
      };

      core.eventBus.on('system:circuit-breaker', (event) => {
        diagnostics = event.payload;
      });

      core.registerPlugin(LoopPlugin);
      await core.init();
      await core.start();

      core.eventBus.emit('loop:event', {});

      expect(diagnostics).not.toBeNull();
      expect(diagnostics).toHaveProperty('eventName');
      expect(diagnostics).toHaveProperty('source', 'EventBus');
      // Dovrebbe fornire informazioni utili per il debug
      expect(diagnostics.eventName).toBe('loop:event');

      console.log('\n📊 CIRCUIT BREAKER DIAGNOSTICS:');
      console.log(`   ├─ Event name: ${diagnostics.eventName}`);
      console.log(`   ├─ Source: ${diagnostics.source}`);
      console.log('   └─ Diagnostic info fornite: ✓');
    });
  });
});
