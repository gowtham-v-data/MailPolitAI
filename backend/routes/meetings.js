const express = require('express');
const Meeting = require('../models/Meeting');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// GET /api/meetings
router.get('/', async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;
    const meetings = await Meeting.find(filter).sort({ date: 1 });
    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/meetings/:id
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/meetings
router.post('/', async (req, res) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/meetings/:id
router.put('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/meetings/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
