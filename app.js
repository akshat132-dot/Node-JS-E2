const express = require('express');

const app = express();

// Middleware
app.use(express.json());

// In-memory data store
// Card shape: { id: number, suit: 'Hearts'|'Diamonds'|'Clubs'|'Spades', value: 'A'|'2'..'10'|'J'|'Q'|'K' }
let nextId = 1;
const cards = [];

const VALID_SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const VALID_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function validateCardPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    errors.push('Body must be a JSON object.');
    return errors;
  }
  const { suit, value } = payload;
  if (!suit || typeof suit !== 'string' || !VALID_SUITS.includes(suit)) {
    errors.push(`suit is required and must be one of: ${VALID_SUITS.join(', ')}`);
  }
  if (!value || typeof value !== 'string' || !VALID_VALUES.includes(value)) {
    errors.push(`value is required and must be one of: ${VALID_VALUES.join(', ')}`);
  }
  return errors;
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// List all cards
app.get('/cards', (req, res) => {
  res.json({ data: cards });
});

// Add a new card
app.post('/cards', (req, res) => {
  const errors = validateCardPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }
  const { suit, value } = req.body;

  // Optional: prevent duplicates of same suit+value
  const exists = cards.some(c => c.suit === suit && c.value === value);
  if (exists) {
    return res.status(409).json({ error: 'Card with same suit and value already exists.' });
  }

  const card = { id: nextId++, suit, value };
  cards.push(card);
  res.status(201).json({ data: card });
});

// Get a card by id
app.get('/cards/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id parameter.' });
  }
  const card = cards.find(c => c.id === id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }
  res.json({ data: card });
});

// Delete a card by id
app.delete('/cards/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id parameter.' });
  }
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Card not found.' });
  }
  const [removed] = cards.splice(index, 1);
  res.json({ data: removed });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = { app };
