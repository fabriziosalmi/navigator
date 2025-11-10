# GitHub Actions Workflows

Questo progetto utilizza GitHub Actions per automatizzare CI/CD.

## 📋 Workflow disponibili

### 1. CI Pipeline (`ci.yml`)

**Trigger:** Ogni push e pull request su qualsiasi branch

**Scopo:** Garantire la qualità del codice

**Step:**
1. ✓ Checkout del codice
2. ✓ Setup Node.js e cache delle dipendenze
3. ✓ Installazione dipendenze (`npm ci`)
4. ✓ Cache e installazione Playwright browsers
5. ✓ **ESLint** - Verifica code quality
6. ✓ **Playwright Tests** - Esecuzione test suite
7. ✓ **Production Build** - Verifica che la build non fallisca
8. ✓ Upload artifacts (test report e build) in caso di failure
9. ✓ Report dimensione build

**Metriche di successo:**
- Tutti i test devono passare
- Linting deve essere pulito (max 50 warnings)
- Build di produzione deve completare senza errori

---

### 2. CD Pipeline (`deploy.yml`)

**Trigger:** Solo push al branch `main` (dopo merge)

**Scopo:** Deploy automatico su GitHub Pages

**Step:**
1. ✓ Esegue tutti gli step della CI (quality gates)
2. ✓ Copia build da `dist/` a `docs/`
3. ✓ Preserva `docs/docs/` (documentazione Docusaurus)
4. ✓ Crea `.nojekyll` per GitHub Pages
5. ✓ Commit automatico delle modifiche
6. ✓ Push al repository

**Risultato:**
- Demo live aggiornata in ~1-2 minuti
- Deploy completamente automatico
- Zero intervento manuale richiesto

---

## 🚀 Come funziona

### Per sviluppatori

1. **Crea un branch** per la tua feature
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Sviluppa e testa localmente**
   ```bash
   npm run dev        # Dev server con HMR
   npm run lint       # Check code quality
   npm test           # Run Playwright tests
   npm run build      # Test production build
   ```

3. **Push e crea PR**
   ```bash
   git push origin feature/my-feature
   ```
   - GitHub Actions esegue automaticamente **CI Pipeline**
   - Verifica che tutti i check siano verdi ✅

4. **Merge su main**
   - Dopo l'approvazione, mergia la PR
   - GitHub Actions esegue automaticamente **CD Pipeline**
   - Demo live aggiornata in 1-2 minuti! 🎉

---

## 📊 Badge e Status

Aggiungi questo badge al README per mostrare lo stato della CI:

```markdown
![CI Status](https://github.com/fabriziosalmi/navigator/workflows/CI%20Pipeline/badge.svg)
```

---

## ⚙️ Configurazione GitHub Pages

Per il deploy automatico, assicurati che GitHub Pages sia configurato:

1. Vai su **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** - Folder: **/docs**
4. Save

Il workflow CD aggiornerà automaticamente `/docs` ad ogni merge su main.

---

## 🔧 Troubleshooting

### CI fallisce per linting
```bash
npm run lint        # Verifica errori localmente
npm run lint:fix    # Auto-fix problemi di formattazione
```

### Test Playwright falliscono
```bash
npm run test:ui     # Debug interattivo
npm run test:debug  # Step-by-step debugging
```

### Build fallisce
```bash
npm run build       # Testa build localmente
npm run preview     # Preview build di produzione
```

### Deploy non aggiorna GitHub Pages
- Verifica che GitHub Pages sia configurato correttamente
- Controlla i logs del workflow CD
- Assicurati che `/docs` contenga `index.html`
- Attendi 2-3 minuti per la propagazione

---

## 📚 Risorse

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Configuration](https://vitejs.dev/guide/build.html)
- [Playwright Testing](https://playwright.dev/)
- [ESLint Rules](https://eslint.org/docs/rules/)
