const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return { stages: [], contacts: [], messages: [] };
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getData() {
  if (!global.__DATA__) {
    global.__DATA__ = loadData();
  }
  return global.__DATA__;
}

module.exports = { getData, saveData };
