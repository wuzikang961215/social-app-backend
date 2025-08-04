const express = require('express');
const router = express.Router();
const treeHoleController = require('../controllers/treeHoleController');
const authMiddleware = require('../middleware/authMiddleware');

// All tree hole routes require authentication
router.use(authMiddleware);

// Get all posts (anonymous)
router.get('/posts', treeHoleController.getPosts);

// Create a new post (anonymous)
router.post('/posts', treeHoleController.createPost);

// Toggle like on a post
router.post('/posts/:postId/like', treeHoleController.toggleLike);

module.exports = router;