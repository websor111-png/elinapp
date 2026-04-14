# Elyn MusicMasking - Desktop App (Electron)

## Cum sa construiesti aplicatia desktop pentru Windows

### Cerinte prealabile
- [Node.js](https://nodejs.org/) v18 sau mai nou
- [Git](https://git-scm.com/)

### Pasi de instalare

1. **Cloneaza sau descarca proiectul**
```bash
# Copiaza folderul electron/ pe PC-ul tau
```

2. **Instaleaza dependentele**
```bash
cd electron
npm install
```

3. **Copiaza iconitele**
```bash
mkdir -p assets
# Copiaza icon-192.png si icon-512.png din frontend/public/ in assets/
```

4. **Ruleaza in modul dezvoltare**
```bash
npm run dev
```

5. **Construieste .exe pentru Windows**
```bash
npm run build:win
```

Fisierul `.exe` va fi generat in folderul `dist/`.

### Structura fisierelor
```
electron/
  main.js          - Procesul principal Electron
  preload.js       - Script preload pentru securitate
  package.json     - Configuratie si build scripts
  assets/          - Iconite si resurse
    icon-512.png
  dist/            - Output build (generat automat)
    ElynMusicMasking-Setup-1.0.0.exe
```

### Note
- Aplicatia desktop se conecteaza la serverul web pentru procesarea audio
- Toate functiile (upload, analiza, masking, restructurare, export) functioneaza identic ca in versiunea web
- Pentru o experienta offline completa, ar fi necesara integrarea backend-ului Python in aplicatie

### Alternativa rapida: PWA (Progressive Web App)
Poti instala aplicatia direct din browser fara Electron:
1. Deschide aplicatia in Chrome/Edge
2. Click pe butonul "Instaleaza pe Desktop" din header
3. Aplicatia se instaleaza ca o aplicatie desktop cu shortcut pe Desktop
