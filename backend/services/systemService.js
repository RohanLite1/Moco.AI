import { exec } from 'child_process';
import os from 'os';

/**
 * Retrieves the device's real battery percentage and charging status
 */
export async function getDeviceBattery() {
  return new Promise((resolve) => {
    // Windows PowerShell CIM Query
    if (process.platform === 'win32') {
      const psCmd = `powershell -NoProfile -Command "(Get-CimInstance Win32_Battery | Select-Object -First 1 EstimatedChargeRemaining, BatteryStatus) | ConvertTo-Json"`;

      exec(psCmd, { timeout: 4000 }, (err, stdout) => {
        if (!err && stdout.trim()) {
          try {
            const data = JSON.parse(stdout.trim());
            const percent = Number(data.EstimatedChargeRemaining) || 100;
            // BatteryStatus 2 = AC connected, 6,7,8,9 = Charging
            const status = Number(data.BatteryStatus) || 1;
            const isCharging = [2, 6, 7, 8, 9].includes(status);

            resolve({
              hasBattery: true,
              percent,
              isCharging,
              status
            });
            return;
          } catch (_) {}
        }

        // Fallback if desktop PC without physical battery
        resolve({
          hasBattery: false,
          percent: 100,
          isCharging: true
        });
      });
      return;
    }

    // Non-Windows fallback
    resolve({
      hasBattery: false,
      percent: 100,
      isCharging: true
    });
  });
}
