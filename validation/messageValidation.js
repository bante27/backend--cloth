const { z } = require('zod');

const sendMessageSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
        subject: z.string({ required_error: "Subject is required" }),
        message: z.string({ required_error: "Message content is required" })
    })
});

const getMessagesSchema = z.object({});

const markAsReadSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Message ID parameter is required" })
    })
});

const replyMessageSchema = z.object({
    body: z.object({
        replyText: z.string({ required_error: "Reply text is required" })
    }),
    params: z.object({
        id: z.string({ required_error: "Message ID parameter is required" })
    })
});

module.exports = {
    sendMessageSchema,
    getMessagesSchema,
    markAsReadSchema,
    replyMessageSchema
};
