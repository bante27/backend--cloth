const express = require('express');
const router = express.Router();
const validate = require('../middleware/validationMiddleware');
const {
    sendMessageSchema,
    getMessagesSchema,
    markAsReadSchema,
    replyMessageSchema
} = require('../validation/messageValidation');
const { sendMessage, getMessages, markAsRead, replyMessage } = require('../controllers/messageController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', validate(sendMessageSchema), sendMessage);
router.get('/', protect, adminOnly, validate(getMessagesSchema), getMessages);
router.put('/:id/read', protect, adminOnly, validate(markAsReadSchema), markAsRead);
router.post('/:id/reply', protect, adminOnly, validate(replyMessageSchema), replyMessage);

module.exports = router;
