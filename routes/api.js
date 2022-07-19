const express = require('express')
const router = express.Router();
const { sendMessagePost,getEstadoServidor } = require('../controllers/web')

router.post('/send', sendMessagePost)
router.post('/getEstado', getEstadoServidor)

module.exports = router