const mongoose = require('mongoose');

const BlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Auto-delete from DB after 24h
});

module.exports = mongoose.model('Blacklist', BlacklistSchema);