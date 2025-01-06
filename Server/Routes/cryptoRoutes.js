const express = require('express');
const { getAllCryptos, getCryptoDetails, addCrypto, refreshCryptoData, } = require('../Controllers/cryptoController');

const router = express.Router();

router.get('/', getAllCryptos);

router.post('/', addCrypto);

router.get('/:symbol', getCryptoDetails);

router.post('/:symbol/refresh', refreshCryptoData);

module.exports = router;
