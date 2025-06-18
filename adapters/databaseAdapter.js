const mongoose = require('mongoose');
const config = require('../config/database');
const fs = require('fs');
const path = require('path');

let isUsingFsDb = false;
const fsDbPath = path.join(__dirname, '../fsdb/data.json');

// Create file if it doesn't exist
function initFsDb() {
  if (!fs.existsSync(fsDbPath)) {
    fs.mkdirSync(path.dirname(fsDbPath), { recursive: true });
    fs.writeFileSync(fsDbPath, JSON.stringify({}), 'utf-8');
  }
  isUsingFsDb = true;
  console.log('MongoDB URL not defined. Using file system database instead.');
}

async function connect() {
  if (!config.url) {
    initFsDb();
    return;
  }

  try {
    await mongoose.connect(config.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    initFsDb(); // fallback on connection error
  }
}

function getDatabase() {
  if (isUsingFsDb) {
    const rawData = fs.readFileSync(fsDbPath, 'utf-8');
    return JSON.parse(rawData);
  } else {
    return mongoose.connection.db;
  }
}

// Optional: allow writing to FS DB
function saveToFsDb(data) {
  if (isUsingFsDb) {
    fs.writeFileSync(fsDbPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

module.exports = { connect, getDatabase, saveToFsDb };
