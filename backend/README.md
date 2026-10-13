# Backend Domain (Moco.AI)

This folder is dedicated entirely to the **Backend Developer**.

## Responsibilities:
- **`main.js`**: Electron lifecycle, frameless transparent overlay window, global shortcut registration (`Alt+Space` or `Ctrl+Space`), system tray.
- **`preload.js`**: Secure IPC bridge exposing methods to the renderer process via `contextBridge.exposeInMainWorld('mocoApi', ...)`.
- **`ipc/`**: Event listeners for all requests sent from the frontend.
- **`services/`**:
  - `geminiService.js`: Official `@google/genai` integration with streaming.
  - `storageService.js`: Persisting user todos, timer history, and configurations in local app data.

## Rules:
- Never edit files in `/frontend/`.
- Ensure all functions exposed in `preload.js` conform to `/shared/contract.js`.
