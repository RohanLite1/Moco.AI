import { processVoiceCommand } from '../services/voiceAgentService.js';

async function testAll() {
  const tests = [
    'open pomodoro',
    'open the pomodoro',
    'start pomodoro',
    'open my tasks',
    'show checklist',
    'calculate 12 * 8',
    'what is 45 plus 55',
    'play a game',
    'play chess',
    'play some music',
    'who are you',
    'tell me a joke'
  ];

  console.log('Testing voice commands with processVoiceCommand:\n');
  for (const t of tests) {
    const start = Date.now();
    const r = await processVoiceCommand(t);
    const ms = Date.now() - start;
    console.log(`[${ms}ms] "${t}" -> Action: ${r.action}, Target: ${r.target || 'none'}, Reply: "${r.reply || ''}"`);
  }
}

testAll().catch(console.error);
