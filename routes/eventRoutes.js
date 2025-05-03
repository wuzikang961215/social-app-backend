const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

// Basic CRUD routes
router.get('/', authMiddleware, eventController.getAllEvents);
router.get('/manage', authMiddleware, eventController.getManageableEvents);
router.get('/my-created', authMiddleware, eventController.getCreatedEvents);
router.get('/my-participated', authMiddleware, eventController.getParticipatedEvents);
router.get('/:id', authMiddleware, eventController.getEventById);
router.post('/', authMiddleware, rateLimiter, eventController.createEvent);
router.patch('/:id', authMiddleware, rateLimiter, eventController.updateEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

// Participant management routes
router.post('/:id/join', authMiddleware, eventController.joinEvent);
router.post('/:id/leave', authMiddleware, eventController.leaveEvent);
router.post('/:id/review', authMiddleware, eventController.reviewParticipant);
router.post('/:id/attendance', authMiddleware, eventController.markAttendance);
router.post('/:id/request-cancel', authMiddleware, eventController.requestCancellation);
router.post('/:id/review-cancel', authMiddleware, eventController.reviewCancellation);

module.exports = router;