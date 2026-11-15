const express = require('express');
const Client = require('../models/Client');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find({ assistantId: req.user._id, status: 'active' }).sort({ name: 1 });
    res.json({ success: true, clients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { name, email, company, phone } = req.body;
    const client = await Client.create({ name, email, company, phone, assistantId: req.user._id });
    await ActivityLog.create({ clientId: client._id, userId: req.user._id, action: 'client_created', description: `Created client "${name}"`, entityType: 'client', entityId: client._id });
    res.status(201).json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/clients/:id/activity
router.get('/:id/activity', async (req, res) => {
  try {
    const activities = await ActivityLog.find({ clientId: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
