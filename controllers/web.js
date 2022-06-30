const fs = require('fs')
const path = require("path");
const { sendMessage } = require('../controllers/send')

const sendMessagePost = (req, res) => {
    //permitir todos.

    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
        res.setHeader('Access-Control-Allow-Credentials', true); // If needed
        const { message, number } = req.body
        const client = req.clientWs || null;
        sendMessage(client, number, message)
        res.send({ status: true })
    }

    catch (err) {
        res.send({ status: false })
    }
}
const indexPath = (req, res) => {
    let indexPath = path.join(__dirname, "../index.html");
    res.sendFile(indexPath);
}

module.exports = { sendMessagePost,  indexPath }