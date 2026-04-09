const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead, replyMessage } = require('../controllers/messageController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', sendMessage);
router.get('/', protect, adminOnly, getMessages);
router.put('/:id/read', protect, adminOnly, markAsRead);
router.post('/:id/reply', protect, adminOnly, replyMessage);

module.exports = router;