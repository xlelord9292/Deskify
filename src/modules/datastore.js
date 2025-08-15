const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

class DataStore {
  constructor({ filename, baseDir }) {
    this.file = path.join(baseDir || process.cwd(), filename);
    this._ensure();
  }

  _ensure() {
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify({ items: [] }, null, 2));
    }
  }

  _read() {
    return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
  }

  _write(data) {
    fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
  }

  getAll() {
    return this._read().items;
  }

  _replaceAll(items) {
    this._write({ items });
  }

  create({ title, description }) {
    if (!title || typeof title !== 'string') throw new Error('Title required');
    const db = this._read();
    const item = { id: uuid(), title: title.trim(), description: (description||'').trim(), createdAt: new Date().toISOString() };
    db.items.push(item);
    this._write(db);
    return item;
  }

  update(id, updates) {
    const db = this._read();
    const idx = db.items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Not found');
    db.items[idx] = { ...db.items[idx], ...updates, updatedAt: new Date().toISOString() };
    this._write(db);
    return db.items[idx];
  }

  delete(id) {
    const db = this._read();
    const before = db.items.length;
    db.items = db.items.filter(i => i.id !== id);
    if (db.items.length === before) throw new Error('Not found');
    this._write(db);
    return true;
  }
}

module.exports = DataStore;
