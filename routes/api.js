const express = require('express')
const router = express.Router();
const { sendMessagePost,get } = require('../controllers/web')

router.post('/send', sendMessagePost)
router.post('/get', get)

module.exports = router