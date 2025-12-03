const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { parseVoiceInput } = require('../services/aiParser');
const Joi = require('joi');

// Validation schema
const taskSchema = Joi.object({
  title: Joi.string().required().max(200),
  description: Joi.string().allow('').max(1000),
  status: Joi.string().valid('To Do', 'In Progress', 'Done').default('To Do'),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  dueDate: Joi.date().allow(null)
});

// GET /api/tasks - Get all tasks with filters
router.get('/', async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks/parse-voice - Parse voice input
router.post('/parse-voice', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const parsed = await parseVoiceInput(transcript);
    res.json({ ...parsed, transcript });
  } catch (error) {
    console.error('Error parsing voice:', error);
    res.status(500).json({ error: 'Failed to parse voice input' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const task = new Task(value);
    await task.save();
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;