const Message = require('../models/Message');
const { transporter } = require('../config/utils');

// 1. Send Message (Public)
exports.sendMessage = async (req, res) => {
  try {
    const newMessage = await Message.create(req.body);
    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Messages (Admin - Shows Red Dot for isRead: false)
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort('-createdAt');
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Mark as Read (Eliminate Red Dot)
exports.markAsRead = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: "Read marker updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Reply via Email
exports.replyMessage = async (req, res) => {
  const { replyText } = req.body;
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Not found" });

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: msg.email,
      subject: `Response to: ${msg.subject}`,
      text: `Hello ${msg.name},\n\n${replyText}\n\nBest regards,\nHabesha Cloth Store`
    };

    await transporter.sendMail(mailOptions);
    msg.isRead = true; // Mark as read once replied
    await msg.save();

    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};