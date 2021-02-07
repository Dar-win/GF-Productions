const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');

router.post('/initiateLNMTransaction', transactionController.initiateTransaction);

module.exports = router;