# NAVIGATOR CORE - ARCHITECTURAL IMPROVEMENTS ROADMAP

**Status**: Proposal for Implementation  
**Based on**: Architectural Stress Test Report v25.0  
**Target**: @navigator.menu/core v4.0.0

---

## 🎯 IMPROVEMENT PROPOSALS

Questo documento contiene proposte di implementazione concrete per le raccomandazioni emerse dallo stress test architetturale.

---

## 1. CIRCUIT BREAKER per Loop Detection (PRIORITY: CRITICAL)

### 1.1 Problema

L'EventBus non protegge contro loop infiniti tra plugin, permettendo scenari come:

```typescript
// Plugin A
core.eventBus.on('event:pong', () => {
  core.eventBus.emit('event:ping', {});
});

// Plugin B  
core.eventBus.on('event:ping', () => {
  core.eventBus.emit('event:pong', {});
});
// 💥 Stack overflow!
```

### 1.2 Soluzione Proposta: EventBus con Circuit Breaker

**File**: `/packages/core/src/EventBus.ts`

#### Opzione A: Call Depth Tracking (Semplice)

```typescript
export class EventBus {
  private callDepthMap: Map<string, number>;
  private readonly MAX_CALL_DEPTH: number;
  
  constructor(options: EventBusOptions = {}) {
    // ... existing code
    this.callDepthMap = new Map();
    this.MAX_CALL_DEPTH = options.maxCallDepth || 100;
  }
  
  emit<T = any>(eventName: string, payload: T = {} as T): boolean {
    // Check call depth
    const currentDepth = this.callDepthMap.get(eventName) || 0;
    
    if (currentDepth >= this.MAX_CALL_DEPTH) {
      console.error(
        `[EventBus] Circuit breaker triggered: "${eventName}" exceeded max call depth (${this.MAX_CALL_DEPTH})`
      );
      this.emit('system:circuit-breaker', {
        eventName,
        depth: currentDepth,
        source: 'EventBus'
      });
      return false; // Interrompi il loop
    }
    
    // Incrementa depth
    this.callDepthMap.set(eventName, currentDepth + 1);
    
    try {
      // ... existing emit logic
      const event: NavigatorEvent<T> = { /* ... */ };
      const processedEvent = this._applyMiddleware(event);
      
      // ... call handlers
      
      return handlersCalled > 0;
    } finally {
      // Decrementa depth
      this.callDepthMap.set(eventName, currentDepth);
    }
  }
}
```

**Pro**:
- Implementazione semplice
- Basso overhead (Map lookup)
- Rileva loop diretti efficacemente

**Contro**:
- Non rileva loop indiretti complessi (A→B→C→A)
- Può dare falsi positivi con eventi legittimi molto annidati

#### Opzione B: Event Chain Tracking (Completo)

```typescript
export class EventBus {
  private eventChain: string[];
  private readonly MAX_CHAIN_LENGTH: number;
  
  constructor(options: EventBusOptions = {}) {
    // ... existing code
    this.eventChain = [];
    this.MAX_CHAIN_LENGTH = options.maxChainLength || 50;
  }
  
  emit<T = any>(eventName: string, payload: T = {} as T): boolean {
    // Rileva cicli nella catena
    const cycleIndex = this.eventChain.lastIndexOf(eventName);
    const hasDirectCycle = cycleIndex !== -1;
    
    if (hasDirectCycle && this.eventChain.length > this.MAX_CHAIN_LENGTH) {
      const cycle = this.eventChain.slice(cycleIndex);
      console.error(
        `[EventBus] Circuit breaker: Cycle detected`,
        {
          event: eventName,
          cycle,
          chainLength: this.eventChain.length
        }
      );
      
      this.emit('system:circuit-breaker', {
        eventName,
        cycle,
        chain: [...this.eventChain],
        source: 'EventBus'
      });
      
      return false;
    }
    
    // Aggiungi alla catena
    this.eventChain.push(eventName);
    
    try {
      // ... existing emit logic
      return handlersCalled > 0;
    } finally {
      // Rimuovi dalla catena
      this.eventChain.pop();
    }
  }
}
```

**Pro**:
- Rileva loop indiretti (A→B→C→A)
- Fornisce informazioni di debug dettagliate
- Nessun falso positivo

**Contro**:
- Overhead leggermente maggiore (array operations)
- Richiede gestione attenta del cleanup

#### 1.3 Configurazione Raccomandata

```typescript
export interface EventBusOptions {
  debugMode?: boolean;
  maxHistorySize?: number;
  // 🆕 Nuove opzioni
  circuitBreaker?: {
    enabled?: boolean;
    maxCallDepth?: number;
    maxChainLength?: number;
    onBreak?: (info: CircuitBreakerInfo) => void;
  };
}

// Uso
const eventBus = new EventBus({
  circuitBreaker: {
    enabled: true,
    maxCallDepth: 100,
    maxChainLength: 50,
    onBreak: (info) => {
      // Log a analytics, notifica sviluppatori, etc.
      analytics.trackError('circuit_breaker_triggered', info);
    }
  }
});
```

#### 1.4 Test da Aggiungere

```typescript
// packages/core/tests/EventBus.circuitbreaker.spec.ts
describe('EventBus Circuit Breaker', () => {
  it('should break direct infinite loops', () => {
    const bus = new EventBus({ circuitBreaker: { maxCallDepth: 10 } });
    let count = 0;
    
    bus.on('event:loop', () => {
      count++;
      bus.emit('event:loop', {});
    });
    
    bus.emit('event:loop', {});
    
    expect(count).toBe(10); // Stopped at max depth
  });
  
  it('should break indirect loops (A→B→C→A)', () => {
    const bus = new EventBus({ circuitBreaker: { maxChainLength: 20 } });
    let aCount = 0, bCount = 0, cCount = 0;
    
    bus.on('a', () => { aCount++; bus.emit('b', {}); });
    bus.on('b', () => { bCount++; bus.emit('c', {}); });
    bus.on('c', () => { cCount++; bus.emit('a', {}); });
    
    bus.emit('a', {});
    
    expect(aCount + bCount + cCount).toBeLessThan(100);
  });
});
```

#### 1.5 Effort & Risk

- **Effort**: 4-6 ore (implementazione + test)
- **Risk**: Basso
- **Breaking Changes**: No (nuova feature opzionale)

---

## 2. PARALLEL PLUGIN INITIALIZATION (PRIORITY: HIGH)

### 2.1 Problema

Init sequenziale blocca l'avvio:

```typescript
// Oggi:
await init(); // 10 secondi se un plugin è lento!

// Plugin ML pesante (10s)
const MLPlugin = {
  async init() {
    await loadHeavyModel(); // 10s
  }
};

// Plugin UI istantaneo (deve aspettare!)
const UIPlugin = {
  init() { /* <1ms */ }
};
```

### 2.2 Soluzione: Priority-Based Parallel Init

#### 2.2.1 Estendi Plugin Interface

```typescript
export interface INavigatorPlugin {
  name: string;
  init(core: NavigatorCore): Promise<void> | void;
  start?(): Promise<void> | void;
  stop?(): Promise<void> | void;
  destroy?(): Promise<void> | void;
  
  // 🆕 Nuove proprietà
  _priority?: number;      // 100+ = critical, <100 = deferred
  _initTimeout?: number;   // Max ms per init (default: 5000)
  _essential?: boolean;    // Se true, init failure blocca tutto
}
```

#### 2.2.2 Modifica NavigatorCore.init()

```typescript
export class NavigatorCore {
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('NavigatorCore: Already initialized');
      return;
    }
    
    this.eventBus.emit('core:init:start', { source: 'NavigatorCore' });
    
    try {
      // Separa plugin per priorità
      const criticalPlugins = this._getCriticalPlugins(); // priority >= 100
      const deferredPlugins = this._getDeferredPlugins(); // priority < 100
      
      // Init critical plugins in PARALLELO con timeout
      await this._initPluginsParallel(criticalPlugins);
      
      this.isInitialized = true;
      this.eventBus.emit('core:init:complete', { 
        critical: criticalPlugins.length,
        deferred: deferredPlugins.length
      });
      
      // Init deferred plugins in background
      this._initDeferredInBackground(deferredPlugins);
      
      if (this.config.autoStart) {
        await this.start();
      }
      
    } catch (error) {
      this.eventBus.emit('core:error', {
        message: 'Core initialization failed',
        error,
        source: 'NavigatorCore'
      });
      throw error;
    }
  }
  
  private async _initPluginsParallel(plugins: INavigatorPlugin[]): Promise<void> {
    const initPromises = plugins.map(plugin => 
      this._initPluginWithTimeout(plugin.name, plugin)
    );
    
    const results = await Promise.allSettled(initPromises);
    
    // Gestisci errori
    const failures = results
      .map((r, i) => ({ result: r, plugin: plugins[i] }))
      .filter(({ result }) => result.status === 'rejected');
    
    if (failures.length > 0) {
      const essentialFailures = failures.filter(f => f.plugin._essential);
      
      if (essentialFailures.length > 0) {
        // Plugin essenziale fallito - blocca tutto
        throw new Error(
          `Essential plugin(s) failed to initialize: ${
            essentialFailures.map(f => f.plugin.name).join(', ')
          }`
        );
      } else {
        // Plugin non essenziali falliti - log warning e continua
        console.warn(
          '[NavigatorCore] Non-essential plugins failed:',
          failures.map(f => f.plugin.name)
        );
      }
    }
  }
  
  private async _initPluginWithTimeout(
    name: string,
    plugin: INavigatorPlugin
  ): Promise<void> {
    const timeout = plugin._initTimeout || 5000;
    
    const initPromise = (async () => {
      try {
        await plugin.init(this);
        this.pluginStates.set(name, 'initialized');
        
        if (this.config.debugMode) {
          console.log(`✓ Plugin "${name}" initialized`);
        }
      } catch (error) {
        console.error(`NavigatorCore: Plugin "${name}" init failed`, error);
        throw error;
      }
    })();
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Plugin "${name}" init timeout (${timeout}ms)`)),
        timeout
      )
    );
    
    return Promise.race([initPromise, timeoutPromise]);
  }
  
  private _initDeferredInBackground(plugins: INavigatorPlugin[]): void {
    // Init deferred plugins uno alla volta in background
    const initNext = async (index: number) => {
      if (index >= plugins.length) {
        this.eventBus.emit('core:deferred:complete', {
          count: plugins.length
        });
        return;
      }
      
      const plugin = plugins[index];
      try {
        await this._initPluginWithTimeout(plugin.name, plugin);
        this.eventBus.emit('plugin:ready', { 
          name: plugin.name,
          deferred: true 
        });
      } catch (error) {
        console.error(`Deferred plugin "${plugin.name}" failed`, error);
      }
      
      // Next plugin
      await initNext(index + 1);
    };
    
    initNext(0);
  }
  
  private _getCriticalPlugins(): INavigatorPlugin[] {
    return this.pluginOrder
      .map(name => this.plugins.get(name)!)
      .filter(plugin => (plugin._priority ?? 50) >= 100)
      .sort((a, b) => (b._priority ?? 50) - (a._priority ?? 50));
  }
  
  private _getDeferredPlugins(): INavigatorPlugin[] {
    return this.pluginOrder
      .map(name => this.plugins.get(name)!)
      .filter(plugin => (plugin._priority ?? 50) < 100)
      .sort((a, b) => (b._priority ?? 50) - (a._priority ?? 50));
  }
}
```

#### 2.2.3 Uso nei Plugin

```typescript
// Plugin critico - deve essere pronto prima di start()
const UIPlugin: INavigatorPlugin = {
  name: 'UIPlugin',
  _priority: 150,      // Alto = critico
  _essential: true,    // Init failure blocca app
  _initTimeout: 1000,  // Deve essere veloce
  init(core) {
    // Setup UI essenziale
  }
};

// Plugin enhancement - può caricarsi dopo
const MLPlugin: INavigatorPlugin = {
  name: 'MLPlugin',
  _priority: 50,       // Basso = deferred
  _essential: false,   // Init failure non critico
  _initTimeout: 30000, // Può impiegare tempo
  async init(core) {
    await loadHeavyModel();
    // Quando pronto, emetti evento
    core.eventBus.emit('ml:ready', {});
  }
};

// App può partire subito con UIPlugin,
// MLPlugin si carica in background
```

#### 2.2.4 Eventi Emessi

```typescript
// Eventi lifecycle estesi
'core:init:start'          // Init iniziato
'core:init:complete'       // Plugin critical pronti
'core:deferred:complete'   // Plugin deferred pronti
'plugin:ready'             // Singolo plugin pronto (deferred)
```

#### 2.2.5 Test da Aggiungere

```typescript
describe('Parallel Plugin Init', () => {
  it('should init critical plugins in parallel', async () => {
    const initTimes: Record<string, number> = {};
    
    const slowPlugin1 = createSlowPlugin('Slow1', 1000, initTimes);
    const slowPlugin2 = createSlowPlugin('Slow2', 1000, initTimes);
    
    slowPlugin1._priority = 100;
    slowPlugin2._priority = 100;
    
    core.registerPlugin(slowPlugin1);
    core.registerPlugin(slowPlugin2);
    
    const start = performance.now();
    await core.init();
    const duration = performance.now() - start;
    
    // Dovrebbe impiegare ~1000ms (parallelo), non ~2000ms (sequenziale)
    expect(duration).toBeLessThan(1500);
  });
  
  it('should timeout slow plugins', async () => {
    const verySlowPlugin: INavigatorPlugin = {
      name: 'VerySlow',
      _priority: 100,
      _initTimeout: 100,
      _essential: false,
      async init() {
        await new Promise(r => setTimeout(r, 5000));
      }
    };
    
    core.registerPlugin(verySlowPlugin);
    
    // Non dovrebbe bloccarsi per 5 secondi
    const start = performance.now();
    await core.init();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
});
```

#### 2.2.6 Breaking Changes & Migration

**Breaking Changes**: ❌ No (backward compatible)

- Plugin senza `_priority` → default 50 (deferred)
- Plugin senza `_essential` → default false
- Plugin senza `_initTimeout` → default 5000ms

**Migration**: Non richiesta, ma raccomandata:

```typescript
// Prima (ancora funzionante)
const MyPlugin = {
  name: 'MyPlugin',
  init(core) { /* ... */ }
};

// Dopo (ottimizzato)
const MyPlugin: INavigatorPlugin = {
  name: 'MyPlugin',
  _priority: 120,      // Se critico per startup
  _essential: true,    // Se l'app non può partire senza
  _initTimeout: 2000,  // Aspetta max 2s
  init(core) { /* ... */ }
};
```

#### 2.2.7 Effort & Risk

- **Effort**: 2-3 giorni (implementazione + test approfonditi + docs)
- **Risk**: Medio-Alto
  - Possibili race condition tra plugin
  - Richiede test estensivi
  - Documentazione chiara necessaria
- **Benefits**: Startup significativamente più veloce

---

## 3. HOT-SWAP API (PRIORITY: MEDIUM)

### 3.1 Problema

Impossibile aggiungere/rimuovere plugin a runtime.

### 3.2 Soluzione: Lifecycle Dinamico

```typescript
export class NavigatorCore {
  /**
   * Add a plugin at runtime (after init/start)
   */
  async addPlugin(
    plugin: INavigatorPlugin,
    options?: PluginOptions
  ): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }
    
    // Register
    this.registerPlugin(plugin, options);
    
    // Se già initialized, init subito
    if (this.isInitialized) {
      await this._initPlugin(plugin.name, plugin);
    }
    
    // Se già running, start subito
    if (this.isRunning) {
      await this._startPlugin(plugin.name, plugin);
    }
    
    this.eventBus.emit('plugin:added', {
      name: plugin.name,
      hotSwap: this.isInitialized
    });
    
    if (this.config.debugMode) {
      console.log(`🔥 Hot-swap: Plugin "${plugin.name}" added`);
    }
  }
  
  /**
   * Remove a plugin at runtime
   */
  async removePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin "${name}" not found`);
      return;
    }
    
    // Stop se running
    if (this.isRunning && this.pluginStates.get(name) === 'started') {
      await this._stopPlugin(name, plugin);
    }
    
    // Destroy se initialized
    if (this.pluginStates.get(name) !== 'registered') {
      await this._destroyPlugin(name, plugin);
    }
    
    // Unregister
    this.plugins.delete(name);
    this.pluginStates.delete(name);
    this.pluginOrder = this.pluginOrder.filter(n => n !== name);
    
    this.eventBus.emit('plugin:removed', { name });
    
    if (this.config.debugMode) {
      console.log(`🗑️ Hot-swap: Plugin "${name}" removed`);
    }
  }
}
```

### 3.3 Use Cases

```typescript
// Carica GesturePlugin solo quando necessario
await core.start();

// Utente entra in modalità gesture
await core.addPlugin(GesturePlugin);

// Utente esce
await core.removePlugin('GesturePlugin');

// Risparmio memoria su mobile
if (isMobile) {
  await core.removePlugin('VoicePlugin');
  await core.removePlugin('AdvancedAnalyticsPlugin');
}
```

### 3.4 Effort & Risk

- **Effort**: 3-4 giorni
- **Risk**: Alto
  - Memory leaks se event cleanup non perfetto
  - State management complesso
  - Richiede test approfonditi

---

## 4. DEBOUNCED STATE WATCHERS (PRIORITY: HIGH)

### 4.1 Soluzione

```typescript
interface WatchOptions {
  mode?: 'sync' | 'debounce' | 'throttle';
  delay?: number;
}

export class AppState {
  watch(
    path: string,
    callback: WatcherCallback,
    options: WatchOptions = {}
  ): () => void {
    const { mode = 'sync', delay = 100 } = options;
    
    let wrappedCallback = callback;
    
    if (mode === 'debounce') {
      wrappedCallback = debounce(callback, delay);
    } else if (mode === 'throttle') {
      wrappedCallback = throttle(callback, delay);
    }
    
    // ... register wrapped callback
  }
}

// Uso
state.watch('user.level', (newLevel) => {
  updateUI(newLevel);
}, { mode: 'debounce', delay: 200 });
```

---

## 📅 IMPLEMENTATION ROADMAP

### Phase 1: Safety & Stability (Week 1-2)
- ✅ Circuit Breaker for EventBus
- ✅ Plugin init timeout
- ✅ Enhanced error handling

### Phase 2: Performance (Week 3-4)
- ✅ Parallel plugin initialization
- ✅ Debounced state watchers
- ✅ Performance benchmarks

### Phase 3: DX & Features (Week 5-6)
- ✅ Hot-swap API
- ✅ Event tracing tools
- ✅ Comprehensive documentation

---

**Status**: Proposal Ready for Review  
**Next Steps**: Team review → Prioritization → Implementation
