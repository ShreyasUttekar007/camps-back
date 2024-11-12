const mongoose = require('mongoose');

const formDataSchema = new mongoose.Schema({
  option: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
    unique: true, // Ensures one vote per IP
  },
});

module.exports = mongoose.model('formData', formDataSchema);
