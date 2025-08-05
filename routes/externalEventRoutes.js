const express = require('express');
const router = express.Router();
const externalEventController = require('../controllers/externalEventController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route - anyone can view events
router.get('/', externalEventController.getEvents);

// Admin only routes - require authentication
router.post('/', authMiddleware, externalEventController.createEvent);
router.put('/:id', authMiddleware, externalEventController.updateEvent);
router.delete('/:id', authMiddleware, externalEventController.deleteEvent);

module.exports = router;