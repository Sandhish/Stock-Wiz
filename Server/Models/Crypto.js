const mongoose = require('mongoose');

const cryptoSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  percentageChange: {
    type: Number, 
    default: 0
  },
  priceHistory: [
    {
      price: Number,
      date: { type: Date, default: Date.now },
    },
  ],
});

const Crypto = mongoose.model('Crypto', cryptoSchema);
module.exports = Crypto;
