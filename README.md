# OlamPlayer -- MVP Release 1.0 (React Native: Android + iOS)

App de player local de audio e video com biblioteca curada, compartilhamento rapido e playlists simples.

## Stack (congelada)
- React Native + TypeScript
- Navegacao: React Navigation (bottom tabs + stacks)
- Estado: Zustand
- DB: react-native-nitro-sqlite
- Audio (background): react-native-track-player
- Video: react-native-video v6
- Share: react-native-share
- Android: SAF (arquivo + pasta) com permissao persistente
- iOS: Document Picker / Files + copia para sandbox

## Estrutura
```
src/
  screens/        # Library, AddMedia, Player, Playlists, Settings
  components/     # listas, cards, controles do player
  stores/         # Zustand stores por feature
  domain/         # use-cases e contratos
  infra/          # adapters: player, file picker, share, SAF/iOS import
  data/           # sqlite + repositories
  models/         # types
```

## Setup
Requisitos: Node.js LTS, Android Studio, Xcode, CocoaPods.

Instalacao:
```bash
npm install
```

iOS (dependencias nativas):
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

## Como rodar
Android:
```bash
npm run android
```

iOS:
```bash
npm run ios
```

Device fisico (Android):
```bash
adb reverse tcp:8081 tcp:8081
npm run start
```

## Fluxos de teste (manual)
### Android (validar localmente)
1. **Adicionar midia**
   - Android: adicionar arquivo (SAF) e pasta (SAF tree)
   - iOS: importar arquivo via Files/Document Picker ou Open In (copia para `Documents/Media`)
2. **Biblioteca**
   - Ver Audios/Videos
   - Buscar por nome
   - Ordenar por Nome/Recentes
   - Abrir item no Player
3. **Player**
   - Audio em background (testar lock screen/headphones)
   - Video fullscreen (controles basicos)
4. **Compartilhar**
   - Compartilhar no Player
   - Testar envio no WhatsApp
5. **Persistencia**
   - Fechar e reabrir o app
   - Biblioteca deve permanecer
6. **Playlists**
   - Criar playlist (audio ou video)
   - Adicionar/remover itens
   - Tocar playlist
   - Reordenar itens (botao ↑ ↓)
7. **Indisponivel**
   - Forcar arquivo inexistente
   - Ver `isAvailable=false` e acao Reimportar
8. **Mini player**
   - Reproduzir audio
   - Navegar entre abas e usar play/pause/prev/next
   - Tocar no titulo e abrir a fila atual
   - Tocar em outro item da fila para trocar a musica

## Progresso (Spike + MVP)
- [x] Setup RN + TypeScript
- [x] SAF arquivo + pasta (Android) e Document Picker (iOS)
- [x] Copia para sandbox no iOS (`Documents/Media`)
- [x] SQLite com `uri` UNIQUE
- [x] Player audio (background) e video (fullscreen)
- [x] Biblioteca simples (Audios/Videos + busca)
- [x] Share (react-native-share)
- [x] Persistencia apos restart
- [x] Playlists simples
- [x] Tratamento de indisponivel (`isAvailable=false` + acao reimportar)
- [x] Playlists tocam via fila (TrackPlayer) sem resetar para item unico
- [x] Video com controles nativos e botao de tela cheia
- [x] Playlists de video avancam automaticamente para o proximo item
- [x] iOS Open In via file handler (importa para sandbox)
- [x] Audio marca indisponivel em erro de playback
- [x] Protecao contra resultados SQLite indefinidos (evita erros de "map")
- [x] Share Android com fallback de cache para content://
- [x] Share Android funcionando com fallback (urls/url) e cache quando possivel
- [x] Mini player persistente com controles e abertura da fila atual
- [x] Selecionar multiplas musicas na biblioteca e criar playlist/reproduzir/adicionar
- [x] Player com aleatorio/repetir tudo/repetir 1 e navegacao consistente
- [x] Reordenacao simples de playlist (mover para cima/baixo)
- [x] Reimportar item indisponivel (seleciona novo arquivo e substitui no catalogo)
- [x] Aviso de duplicados ao adicionar arquivos/pasta (pular ou substituir)
- [x] Indexacao de pasta filtra apenas arquivos suportados

Observacao: validacao manual no Android concluida em 8 fev 2026. iOS ainda pendente (sem Mac/Xcode no ambiente atual).
2026-02-05: Android - crash de inicializacao por feature flags duplicadas corrigido; app inicia no device apos rebuild.
2026-02-06: Android - build limpo e reinstalado; NitroModules sem erro nos logs com Metro ativo.
2026-02-06: Android - Share recebeu fallback (content:// -> cache) e protecao extra contra falhas.
2026-02-06: Android - Share voltou a abrir a folha de compartilhamento no device.

## Observacoes e limitacoes conhecidas
- Android 13+: e necessario conceder permissao de **notificacoes** para que o player em background mostre a notificacao.
- Video usa controles nativos do `react-native-video`; o botao de play/pause adicional apenas sincroniza o estado visual.
- Reordenacao de playlist foi incluida de forma simples (botoes ↑ ↓).
- iOS nao foi validado localmente (sem Mac/Xcode no ambiente atual).
- Validacoes manuais em device devem ser executadas antes de release (ver checklist acima).

## Checklist de validacao (pre-release)
### Android
- [x] Adicionar arquivo via SAF (audio/video)
- [x] Adicionar pasta via SAF e indexar sem travar
- [x] Persistencia apos restart
- [x] Player audio em background
- [x] Player video fullscreen
- [x] Share no WhatsApp (audio e video)
- [x] Indisponivel + Reimportar funcionando
### iOS
- [ ] Import via Files/Document Picker
- [ ] Open In (compartilhar para o app)
- [ ] Copia para `Documents/Media`
- [ ] Player audio/video
- [ ] Share no WhatsApp

## Scripts
- `npm run start` -- Metro
- `npm run android` -- build/run Android
- `npm run ios` -- build/run iOS

## Build de release (Android)
1. Configure o keystore e a assinatura (Gradle).
2. Gere o bundle:
```bash
cd android
gradlew bundleRelease
```
3. O arquivo AAB fica em `android/app/build/outputs/bundle/release/`.

## Build de release (iOS)
- Requer macOS + Xcode.
- Abrir o projeto em `ios/` e gerar o build pelo Xcode.

## Documentos de referencia
- `epico_mvp_player_rn.md`
- `release_scope_mvp_rn.md`
- `tech_stack_decision_rn.md`
- `architecture_contracts_rn.md`
- `spike_plan_rn.md`
