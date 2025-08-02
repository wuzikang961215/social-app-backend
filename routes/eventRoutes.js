const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');
const { 
  validateCreateEvent, 
  validateJoinEvent,
  validateUpdateEvent, 
  validateReviewParticipant,
  validateMarkAttendance 
} = require('../middleware/validation');

// Basic CRUD routes
router.get('/', authMiddleware, eventController.getAllEvents);
router.get('/manage', authMiddleware, eventController.getManageableEvents);
router.get('/my-created', authMiddleware, eventController.getCreatedEvents);
router.get('/my-participated', authMiddleware, eventController.getParticipatedEvents);
router.get('/:id', authMiddleware, validateJoinEvent, eventController.getEventById);
router.post('/', authMiddleware, rateLimiter, validateCreateEvent, eventController.createEvent);
router.patch('/:id', authMiddleware, rateLimiter, validateUpdateEvent, eventController.updateEvent);
router.delete('/:id', authMiddleware, validateJoinEvent, eventController.deleteEvent);

// Participant management routes
router.post('/:id/join', authMiddleware, validateJoinEvent, eventController.joinEvent);
router.post('/:id/leave', authMiddleware, validateJoinEvent, eventController.leaveEvent);
router.post('/:id/review', authMiddleware, validateReviewParticipant, eventController.reviewParticipant);
router.post('/:id/attendance', authMiddleware, validateMarkAttendance, eventController.markAttendance);
router.post('/:id/request-cancel', authMiddleware, eventController.requestCancellation);
router.post('/:id/review-cancel', authMiddleware, eventController.reviewCancellation);

module.exports = router;