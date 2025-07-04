require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getData, saveData } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Pipeline CRUD Endpoints ----------
app.get('/api/stages', (req, res) => {
  const data = getData();
  res.json(data.stages.sort((a, b) => a.position - b.position));
});

app.post('/api/stages', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const data = getData();
  const id = Date.now();
  const position = data.stages.length + 1;
  data.stages.push({ id, name, position });
  saveData(data);
  res.json({ id, name, position });
});

app.put('/api/stages/:id', (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;
  const data = getData();
  const stage = data.stages.find(s => s.id == id);
  if (!stage) return res.status(404).json({ error: 'not found' });
  if (name !== undefined) stage.name = name;
  if (position !== undefined) stage.position = position;
  saveData(data);
  res.json(stage);
});

app.delete('/api/stages/:id', (req, res) => {
  const { id } = req.params;
  const data = getData();
  const idx = data.stages.findIndex(s => s.id == id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.stages.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// Contacts CRUD
app.get('/api/pipeline-contacts', (req, res) => {
  const data = getData();
  res.json(data.contacts);
});

app.post('/api/pipeline-contacts', (req, res) => {
  const { name, project, amount, stageId } = req.body;
  const data = getData();
  const id = Date.now();
  data.contacts.push({ id, name, project, amount, stageId });
  saveData(data);
  res.json({ id, name, project, amount, stageId });
});

app.put('/api/pipeline-contacts/:id', (req, res) => {
  const { id } = req.params;
  const data = getData();
  const contact = data.contacts.find(c => c.id == id);
  if (!contact) return res.status(404).json({ error: 'not found' });
  const { name, project, amount, stageId } = req.body;
  if (name !== undefined) contact.name = name;
  if (project !== undefined) contact.project = project;
  if (amount !== undefined) contact.amount = amount;
  if (stageId !== undefined) contact.stageId = stageId;
  saveData(data);
  res.json(contact);
});

app.delete('/api/pipeline-contacts/:id', (req, res) => {
  const { id } = req.params;
  const data = getData();
  const idx = data.contacts.findIndex(c => c.id == id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.contacts.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// Messages CRUD
app.get('/api/messages/:contactId', (req, res) => {
  const { contactId } = req.params;
  const data = getData();
  const msgs = data.messages.filter(m => m.contactId == contactId);
  res.json(msgs);
});

app.post('/api/messages', (req, res) => {
  const { contactId, content, direction = 'out' } = req.body;
  const data = getData();
  const id = Date.now();
  const timestamp = new Date().toISOString();
  const message = { id, contactId, content, direction, timestamp };
  data.messages.push(message);
  saveData(data);
  res.json(message);
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CRM backend listening on port ${PORT}`);
  });
}

module.exports = app;
