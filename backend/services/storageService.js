import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), '.moco-data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to read storage:', e);
  }
  return {};
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to save storage:', e);
    return false;
  }
}

export function getItem(key, defaultValue = null) {
  const data = loadData();
  return data[key] !== undefined ? data[key] : defaultValue;
}

export function setItem(key, value) {
  const data = loadData();
  data[key] = value;
  return saveData(data);
}
