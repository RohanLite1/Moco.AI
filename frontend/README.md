# Frontend Domain (Moco.AI)

This folder is dedicated entirely to the **Frontend Developer**.

## Responsibilities:
- **`src/visuals3d/`**: 3D Visualizer / Avatar (Three.js procedural hologram orb, particle mesh, reacting to AI speech states).
- **`src/components/`**: Floating HUD layout, navigation tab bar, window drag handles, glassmorphism framing.
- **`src/widgets/`**:
  - `ChatWidget.jsx`: Conversational UI with streaming text responses.
  - `PomodoroWidget.jsx`: Focus timer with break/work cycles and audio chimes.
  - `TodoWidget.jsx`: Interactive checklist with persistence.
  - `MusicWidget.jsx`: Mini lo-fi/productivity music player with sound controls.
  - `GamesWidget.jsx`: Quick mini-games for study breaks (e.g. 2048, Tic-Tac-Toe, Snake).
- **`src/styles/`**: Modern Cyber-Clean glassmorphic CSS styling.

## Independent Browser Testing (Zero-Block Workflow):
You do NOT need the backend running to build and test your UI!
Run:
```bash
npm run dev:frontend
```
Open `http://localhost:5173` in any standard browser. The frontend automatically falls back to `src/services/mockApi.js` with simulated AI responses and mock storage!

## Rules:
- Never edit files in `/backend/`.
- All backend communication happens through `src/services/api.js`.
