// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// All routes below are protected
router.use(auth);

// @route   GET /api/tasks
// @desc    Get tasks (optionally filter by status)
router.get('/', async (req, res) => {
  const { filter } = req.query; // filter = all | pending | completed
  const query = { user: req.userId };
  if (filter === 'pending') query.completed = false;
  else if (filter === 'completed') query.completed = true;
  try {
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  try {
    const task = new Task({ user: req.userId, title, description });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task (title/description)
router.put('/:id', async (req, res) => {
  const { title, description } = req.body;
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/tasks/:id/toggle
// @desc    Toggle completed flag
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
