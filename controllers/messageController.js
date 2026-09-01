const messageService = require('../services/messageService');
const catchAsync = require('../utils/catchAsync')
exports.sendMessage = catchAsync(async (req, res) => {
  const newMessage = await messageService.sendMessage(req.body);
  res.status(201).json({ success: true, data: newMessage });
});
exports.getMessages = catchAsync(async (req, res) => {
  const messages = await messageService.getMessages();
  res.status(200).json({ success: true, data: messages });
});
exports.markAsRead = catchAsync(async (req, res) => {
  await messageService.markAsRead(req.params.id);
  res.status(200).json({ success: true, message: "Read marker updated" });
});
exports.replyMessage = catchAsync(async (req, res) => {
  await messageService.replyMessage(req.params.id, req.body.replyText);
  res.status(200).json({ success: true, message: "Email sent successfully!" });
});
