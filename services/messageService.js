const Message = require('../models/Message');
const { transporter } = require('../config/utils');
const AppError = require('../utils/appError');

class MessageService {
    async sendMessage(body) {
        const newMessage = await Message.create(body);
        return newMessage;
    }

    async getMessages() {
        const messages = await Message.find().sort('-createdAt');
        return messages;
    }

    async markAsRead(id) {
        const message = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!message) throw new AppError("Message not found", 404);
        return message;
    }

    async replyMessage(id, replyText) {
        const msg = await Message.findById(id);
        if (!msg) throw new AppError("Message not found", 404);

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: msg.email,
            subject: `Response to: ${msg.subject}`,
            text: `Hello ${msg.name},\n\n${replyText}\n\nBest regards,\nHabesha Cloth Store`
        };

        await transporter.sendMail(mailOptions);
        msg.isRead = true;
        await msg.save();
        return true;
    }
}

module.exports = new MessageService();
