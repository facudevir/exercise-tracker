const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const users = []; // { _id, username }
const exercises = {}; // map _id -> [ { description, duration, date } ]

function formatDate(d) {
  const date = new Date(d);
  return date.toDateString();
}

// POST /api/users -> { username, _id }
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: 'username required' });
  const _id = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
  const user = { username, _id };
  users.push(user);
  exercises[_id] = [];
  res.json(user);
});

// GET /api/users -> [ { username, _id } ]
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises
// form data: description, duration, date (optional: YYYY-MM-DD)
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const user = users.find(u => u._id === _id);
  if (!user) return res.status(400).json({ error: 'unknown userId' });

  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  if (!description || !duration) return res.status(400).json({ error: 'description and duration required' });
  if (isNaN(duration)) return res.status(400).json({ error: 'duration must be a number' });

  const exercise = { description, duration, date: formatDate(date) };
  exercises[_id].push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: exercise.date,
    duration: exercise.duration,
    description: exercise.description
  });
});

// GET /api/users/:_id/logs?[from][to][limit]
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const user = users.find(u => u._id === _id);
  if (!user) return res.status(400).json({ error: 'unknown userId' });

  let log = exercises[_id] || [];

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;

  if (from) log = log.filter(e => new Date(e.date) >= from);
  if (to) log = log.filter(e => new Date(e.date) <= to);
  if (limit) log = log.slice(0, limit);

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map(e => ({ description: e.description, duration: e.duration, date: e.date }))
  });
});

// Root
app.get('/', (req, res) => {
  res.send('Exercise Tracker API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
