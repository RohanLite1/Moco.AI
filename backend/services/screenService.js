import electron from 'electron';
import dotenv from 'dotenv';
dotenv.config();

const { desktopCapturer, screen } = electron;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

/**
 * Captures screenshot of the primary screen
 * Returns base64 data URL and screen resolution
 */
export async function capturePrimaryScreen() {
  const primaryDisplay = screen ? screen.getPrimaryDisplay() : { size: { width: 1920, height: 1080 } };
  const { width, height } = primaryDisplay.size;

  if (!desktopCapturer) {
    return {
      success: false,
      error: 'desktopCapturer is only available in Electron main process'
    };
  }

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  });

  if (!sources || sources.length === 0) {
    throw new Error('No screen sources found');
  }

  // Use primary screen source
  const primarySource = sources[0];
  const thumbnail = primarySource.thumbnail;
  const dataUrl = thumbnail.toDataURL(); // base64 PNG
  const rawBase64 = dataUrl.replace(/^data:image\/png;base64,/, '');

  return {
    success: true,
    dataUrl,
    rawBase64,
    sourceName: primarySource.name,
    resolution: { width, height },
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyzes the captured screen using Ollama
 * If vision model is active, sends base64 image; otherwise analyzes screen context.
 */
export async function analyzeScreen(prompt = 'What is on my display?') {
  const capture = await capturePrimaryScreen();
  if (!capture.success) {
    return { error: capture.error };
  }

  try {
    // Check if Ollama supports vision models or prompt Ollama with image
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: `The user took a screenshot of their desktop (${capture.resolution.width}x${capture.resolution.height}). User Question: "${prompt}". Provide a helpful, intelligent productivity breakdown or advice.`,
        images: [capture.rawBase64], // Supported if using multimodal model
        stream: false
      })
    });

    if (!response.ok) {
      // Fallback if model doesn't support images
      const fallbackResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: `User is viewing their screen (${capture.resolution.width}x${capture.resolution.height} at ${capture.timestamp}). User question: "${prompt}". Answer concisely.`,
          stream: false
        })
      });
      const fallbackData = await fallbackResponse.json();
      return {
        capture: { resolution: capture.resolution, timestamp: capture.timestamp },
        analysis: fallbackData.response
      };
    }

    const data = await response.json();
    return {
      capture: { resolution: capture.resolution, timestamp: capture.timestamp },
      analysis: data.response
    };
  } catch (err) {
    return {
      capture: { resolution: capture.resolution, timestamp: capture.timestamp },
      analysis: `Screen captured successfully (${capture.resolution.width}x${capture.resolution.height}), but analysis failed: ${err.message}`
    };
  }
}
