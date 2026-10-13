# Antigravity Collaboration Rules: Moco.AI

## Project Architecture & Strict Isolation Rules
This project is strictly divided into two distinct domains to allow two developers and their Antigravity AI agents to work simultaneously without colliding.

### 1. `backend/` (Domain: Backend Developer)
- **Scope**: Electron main process, window management, transparent overlay, global shortcuts (`Alt+Space`), system tray, local storage, and AI service (Google Gemini API).
- **Rule for Backend Agent**:
  - When instructed to work on the backend, **ONLY inspect and modify files inside `/backend/` and `/shared/`**.
  - **DO NOT** modify, delete, or touch any files inside `/frontend/`.
  - All features must be exposed to the frontend via `backend/preload.js` under `window.mocoApi` conforming to `shared/contract.js`.

### 2. `frontend/` (Domain: Frontend Developer)
- **Scope**: React (Vite), Three.js 3D avatar/visualizer, UI components, HUD glassmorphic layouts, CSS styles, and widgets (Chat, Pomodoro, Todo, Music, Games).
- **Rule for Frontend Agent**:
  - When instructed to work on the frontend, **ONLY inspect and modify files inside `/frontend/` and `/shared/`**.
  - **DO NOT** modify, delete, or touch any files inside `/backend/`.
  - Frontend must communicate with the backend exclusively through `frontend/src/services/api.js`, which uses `window.mocoApi` with fallback to `mockApi.js` for standalone browser testing.

### 3. `shared/` (The Bridge Contract)
- Contains `contract.js` defining IPC channel names and API signatures.
- Any change to `shared/contract.js` must be agreed upon by both developers.
