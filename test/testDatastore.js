const assert = require('assert');
const fs = require('fs');
const path = require('path');
const DataStore = require('../src/modules/datastore');

const TMP = path.join(__dirname, 'tmp-data.json');
if (fs.existsSync(TMP)) fs.unlinkSync(TMP);

const store = new DataStore({ filename: 'test/tmp-data.json' });

// create
const created = store.create({ title: 'Hello', description: 'World' });
assert(created.id, 'id present');

// list
const all = store.getAll();
assert(all.length === 1, 'one item stored');

// update
const updated = store.update(created.id, { title: 'Hi' });
assert(updated.title === 'Hi', 'title updated');

// delete
store.delete(created.id);
assert(store.getAll().length === 0, 'item deleted');

console.log('Datastore tests passed');
