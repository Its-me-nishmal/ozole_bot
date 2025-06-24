const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

const CONSULTATION_FILE = path.join(__dirname, '../data/consultation.json');

function readConsultations() {
  if (!fs.existsSync(CONSULTATION_FILE)) return [];
  return JSON.parse(fs.readFileSync(CONSULTATION_FILE, 'utf-8'));
}

function writeConsultations(data) {
  fs.writeFileSync(CONSULTATION_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function clearExpiredConsultations() {
  const now = DateTime.now().setZone('Asia/Kolkata');
  const consultations = readConsultations();

  const valid = consultations.filter(c => {
    if (!c.date || !c.time) return false;
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

const CONSULTATION_FILE = path.join(__dirname, '../data/consultation.json');

function readConsultations() {
  if (!fs.existsSync(CONSULTATION_FILE)) return [];
  return JSON.parse(fs.readFileSync(CONSULTATION_FILE, 'utf-8'));
}

function writeConsultations(data) {
  fs.writeFileSync(CONSULTATION_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function clearExpiredConsultations() {
  const now = DateTime.now().setZone('Asia/Kolkata');
  const consultations = readConsultations();

  const valid = consultations.filter(c => {
    if (!c.date || !c.time) return false;

    const scheduled = DateTime.fromFormat(`${c.date} ${c.time}`, 'yyyy-MM-dd hh:mm a', {
      zone: 'Asia/Kolkata'
    });

    return scheduled > now;
  });

  const removed = consultations.length - valid.length;
  if (removed > 0) {
    writeConsultations(valid);
    console.log(`🧹 Cleared ${removed} expired/invalid consultations`);
  }
}

module.exports = clearExpiredConsultations;

    const scheduled = DateTime.fromFormat(`${c.date} ${c.time}`, 'yyyy-MM-dd hh:mm a', {
      zone: 'Asia/Kolkata'
    });

    return scheduled > now;
  });

  const removed = consultations.length - valid.length;
  if (removed > 0) {
    writeConsultations(valid);
    console.log(`🧹 Cleared ${removed} expired/invalid consultations`);
  }
}

module.exports = clearExpiredConsultations;
