import electron from 'electron';
const { BrowserWindow, screen, app } = electron;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mascotWindow = null;

// Fallback HTML for the low-opacity floating dog logo
const FALLBACK_MASCOT_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }
    body {
      background: transparent;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .mascot-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .mascot-container:hover {
      transform: scale(1.1);
    }
    .dog-bubble {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid rgba(6, 182, 212, 0.6);
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), inset 0 0 10px rgba(6, 182, 212, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    .dog-svg {
      width: 40px;
      height: 40px;
      fill: none;
      stroke: #06b6d4;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .preview-tip {
      position: absolute;
      bottom: -22px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #38bdf8;
      background: rgba(0, 0, 0, 0.7);
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      white-space: nowrap;
      opacity: 0;
      transform: translateY(-4px);
      transition: all 0.2s ease;
      pointer-events: none;
    }
    .mascot-container:hover .preview-tip {
      opacity: 1;
      transform: translateY(0);
    }
    .mascot-container:hover .dog-bubble {
      border-color: #38bdf8;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.7);
    }
  </style>
</head>
<body>
  <div class="mascot-container" id="dogBtn">
    <div class="dog-bubble">
      <!-- Cyber Dog Icon -->
      <svg class="dog-svg" viewBox="0 0 24 24">
        <path d="M10 5.172C10 3.974 11.026 3 12.292 3c1.265 0 2.292.974 2.292 2.172v.328M9 14h6M9 11h6M7 16l-1 4h12l-1-4M4.5 9.5C3.12 9.5 2 10.62 2 12s1.12 2.5 2.5 2.5h.5v-5h-.5zm15 0c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-.5v-5h.5zM6 8.5C6 7.12 7.12 6 8.5 6h7c1.38 0 2.5 1.12 2.5 2.5V17H6V8.5z"/>
      </svg>
    </div>
    <div class="preview-tip">Click to Open Moco</div>
  </div>

  <script>
    const btn = document.getElementById('dogBtn');
    btn.addEventListener('mouseenter', () => {
      window.mocoApi?.mascotHover(true);
    });
    btn.addEventListener('mouseleave', () => {
      window.mocoApi?.mascotHover(false);
    });
    btn.addEventListener('click', () => {
      window.mocoApi?.mascotClick();
    });
  </script>
</body>
</html>
`;

export function getMascotWindow() {
  return mascotWindow;
}

export function createMascotWindow(mainWindow) {
  if (mascotWindow && !mascotWindow.isDestroyed()) {
    mascotWindow.show();
    return mascotWindow;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const baseSize = 85;
  const x = width - baseSize - 20;
  const y = height - baseSize - 20;

  mascotWindow = new BrowserWindow({
    width: baseSize,
    height: baseSize,
    x,
    y,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    opacity: 0.35, // Low opacity by default
    webPreferences: {
      preload: path.join(__dirname, '../preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mascotWindow.setAlwaysOnTop(true, 'screen-saver');

  // Load mascot HTML
  mascotWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(FALLBACK_MASCOT_HTML)}`);

  return mascotWindow;
}

export function handleMascotHover(isHovered) {
  if (!mascotWindow || mascotWindow.isDestroyed()) return;

  if (isHovered) {
    // Expand to full opacity and slightly larger hit area for preview
    mascotWindow.setOpacity(1.0);
  } else {
    // Fade back to low opacity
    mascotWindow.setOpacity(0.35);
  }
}

export function handleMascotClick(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

export function destroyMascotWindow() {
  if (mascotWindow && !mascotWindow.isDestroyed()) {
    mascotWindow.close();
    mascotWindow = null;
  }
}
