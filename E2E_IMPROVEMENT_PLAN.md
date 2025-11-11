# E2E Improvement Plan - Navigator Test-Driven Debugging

## Overview
This document tracks all known issues that need E2E test coverage. Each issue follows the TDD cycle: Red (failing test) → Green (fix) → Refactor (optimize).

---

## Issue #1: Navigator Auto-Start Failure
**Priority:** 🔴 CRITICA

### Descrizione del Comportamento Atteso
Quando l'applicazione viene caricata, il Navigator Core dovrebbe auto-avviarsi automaticamente e mostrare lo stato "Running" nella UI.

### Descrizione del Comportamento Errato
Attualmente, l'applicazione si carica con status "⏸️ Stopped" invece di "▶️ Running". Il Navigator non si auto-avvia, richiedendo un'azione manuale dell'utente.

### Scenario di Test da Scrivere
```typescript
test('Navigator should auto-start on page load', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Il Navigator dovrebbe essere in stato Running
  const statusValue = page.locator('.status-value').first();
  await expect(statusValue).toContainText('Running');
  
  // Non dovrebbe essere Stopped
  await expect(statusValue).not.toContainText('Stopped');
});
```

### Causa Probabile
- Il metodo `navigator.start()` non viene chiamato dopo l'inizializzazione
- Manca un `autoStart: true` nella configurazione
- Il React hook `useNavigator` non avvia il core automaticamente

### File da Modificare
- `packages/react/src/useNavigator.ts`
- `apps/react-test-app/src/App.tsx`

---

## Issue #2: Keyboard Events Not Captured
**Priority:** 🔴 CRITICA

### Descrizione del Comportamento Atteso
Quando l'utente preme un tasto qualsiasi, il plugin keyboard dovrebbe catturare l'evento e aggiornare l'interfaccia mostrando:
- L'ultimo tasto premuto (`lastKey`)
- Il contatore degli eventi incrementato

### Descrizione del Comportamento Errato
I tasti premuti non vengono catturati. Il valore `lastKey` rimane "none" e il contatore rimane a 0, anche dopo aver premuto tasti.

### Scenario di Test da Scrivere
```typescript
test('should capture keyboard events', async ({ page }) => {
  await page.goto('/');
  
  // Premi un tasto
  await page.keyboard.press('ArrowUp');
  
  // Verifica che lastKey sia aggiornato
  const lastKey = page.getByTestId('last-key');
  await expect(lastKey).toContainText('ArrowUp');
  await expect(lastKey).not.toContainText('none');
  
  // Verifica che il contatore sia > 0
  const eventCount = page.getByTestId('event-count');
  await expect(eventCount).not.toContainText('0');
});
```

### Causa Probabile
- Il plugin keyboard non è registrato correttamente
- Il listener degli eventi non è attivo perché il Navigator è fermo
- Il focus non è sul documento/body

### File da Modificare
- `packages/plugin-keyboard/src/KeyboardPlugin.ts`
- `apps/react-test-app/src/App.tsx`

---

## Issue #3: Rapid Input Race Condition
**Priority:** 🟠 ALTA

### Descrizione del Comportamento Atteso
Quando l'utente preme 20 tasti in rapida successione (< 50ms tra un tasto e l'altro), tutti gli eventi dovrebbero essere catturati e il contatore dovrebbe mostrare esattamente 20.

### Descrizione del Comportamento Errato
Con input molto rapidi, alcuni eventi potrebbero essere persi a causa di race conditions nell'aggiornamento dello stato React o nella coda degli eventi del core.

### Scenario di Test da Scrivere
```typescript
test('should handle rapid keyboard input without losing events', async ({ page }) => {
  await page.goto('/');
  
  const keysToPress = 20;
  for (let i = 0; i < keysToPress; i++) {
    await page.keyboard.press('a', { delay: 10 }); // Input molto rapido
  }
  
  await page.waitForTimeout(500); // Attendi che tutti gli eventi siano processati
  
  const eventCount = page.getByTestId('event-count');
  const count = await eventCount.textContent();
  expect(parseInt(count || '0')).toBe(keysToPress);
});
```

### Causa Probabile
- Gli aggiornamenti di stato React vengono batchati e alcuni eventi si perdono
- La coda degli eventi del core non è implementata correttamente
- `useState` non è atomico e andrebbe sostituito con `useReducer`

### File da Modificare
- `apps/react-test-app/src/App.tsx`
- `packages/core/src/EventBus.ts`

---

## Issue #4: Key History Display Missing
**Priority:** 🟠 ALTA

### Descrizione del Comportamento Atteso
L'interfaccia dovrebbe mostrare una "Key History" con gli ultimi 5 tasti premuti in ordine cronologico inverso (più recente → più vecchio).

### Descrizione del Comportamento Errato
Il componente `key-history` non esiste o non è visibile nell'interfaccia.

### Scenario di Test da Scrivere
```typescript
test('should display key history panel', async ({ page }) => {
  await page.goto('/');
  
  // Premi alcuni tasti
  await page.keyboard.press('a');
  await page.keyboard.press('b');
  await page.keyboard.press('c');
  
  // Verifica che il pannello history esista e sia visibile
  const history = page.getByTestId('key-history');
  await expect(history).toBeVisible();
  
  // Verifica che contenga i tasti premuti
  const historyText = await history.textContent();
  expect(historyText).toContain('a');
  expect(historyText).toContain('b');
  expect(historyText).toContain('c');
});
```

### Causa Probabile
- Il componente UI per la history non è stato implementato
- Manca la logica per memorizzare lo storico degli eventi

### File da Modificare
- `apps/react-test-app/src/App.tsx`
- Creare nuovo componente `KeyHistory.tsx`

---

## Issue #5: Special Keys Not Handled Correctly
**Priority:** 🟡 MEDIA

### Descrizione del Comportamento Atteso
I tasti speciali (Enter, Space, Tab, Escape) dovrebbero essere catturati e visualizzati con i loro nomi leggibili, non come caratteri strani.

### Descrizione del Comportamento Errato
Alcuni tasti speciali potrebbero non essere catturati o visualizzati correttamente.

### Scenario di Test da Scrivere
```typescript
test('should handle special keys correctly', async ({ page }) => {
  await page.goto('/');
  
  const specialKeys = ['Enter', 'Space', 'Tab', 'Escape'];
  
  for (const key of specialKeys) {
    await page.keyboard.press(key);
    const lastKey = page.getByTestId('last-key');
    await expect(lastKey).toContainText(key);
  }
});
```

### Causa Probabile
- Il plugin keyboard non normalizza i nomi dei tasti speciali
- La mappatura dei codici dei tasti non è completa

### File da Modificare
- `packages/plugin-keyboard/src/KeyboardPlugin.ts`

---

## Issue #6: Multiple Navigator Instances Leak
**Priority:** 🟡 MEDIA

### Descrizione del Comportamento Atteso
Quando il componente React viene smontato e rimontato (es. navigazione tra pagine), il vecchio Navigator dovrebbe essere distrutto completamente per evitare memory leak.

### Descrizione del Comportamento Errato
Potrebbero rimanere listener attivi anche dopo lo smontaggio del componente.

### Scenario di Test da Scrivere
```typescript
test('should cleanup Navigator on unmount', async ({ page }) => {
  await page.goto('/');
  
  // Attendi inizializzazione
  await page.waitForLoadState('networkidle');
  
  // Reload della pagina (simula unmount/remount)
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Verifica che non ci siano errori in console
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.keyboard.press('a');
  await page.waitForTimeout(500);
  
  expect(errors).toHaveLength(0);
});
```

### Causa Probabile
- Il `useEffect` cleanup in `useNavigator` non chiama `navigator.destroy()`
- I listener del plugin keyboard non vengono rimossi

### File da Modificare
- `packages/react/src/useNavigator.ts`
- `packages/plugin-keyboard/src/KeyboardPlugin.ts`

---

## Issue #7: State Persistence Across Reloads
**Priority:** 🔵 BASSA

### Descrizione del Comportamento Atteso
Dopo un reload della pagina, lo stato dovrebbe tornare completamente pulito (contatore a 0, lastKey a "none").

### Descrizione del Comportamento Errato
Potrebbe esserci uno stato "fantasma" che persiste se non si fa cleanup corretto.

### Scenario di Test da Scrivere
```typescript
test('should reset state after page reload', async ({ page }) => {
  await page.goto('/');
  
  // Premi alcuni tasti
  await page.keyboard.press('a');
  await page.keyboard.press('b');
  
  // Reload
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Verifica stato pulito
  const lastKey = page.getByTestId('last-key');
  const eventCount = page.getByTestId('event-count');
  
  await expect(lastKey).toContainText('none');
  await expect(eventCount).toContainText('0');
});
```

### File da Modificare
- `apps/react-test-app/src/App.tsx`

---

## Priorità di Esecuzione

1. ✅ Issue #1: Navigator Auto-Start Failure (CRITICA)
2. ✅ Issue #2: Keyboard Events Not Captured (CRITICA)
3. Issue #3: Rapid Input Race Condition (ALTA)
4. Issue #4: Key History Display Missing (ALTA)
5. Issue #5: Special Keys Not Handled Correctly (MEDIA)
6. Issue #6: Multiple Navigator Instances Leak (MEDIA)
7. Issue #7: State Persistence Across Reloads (BASSA)

---

## Progress Tracking

- [ ] Issue #1: Test scritto, in attesa di fix
- [ ] Issue #2: Test scritto, in attesa di fix
- [ ] Issue #3: Da scrivere
- [ ] Issue #4: Da scrivere
- [ ] Issue #5: Da scrivere
- [ ] Issue #6: Da scrivere
- [ ] Issue #7: Da scrivere
