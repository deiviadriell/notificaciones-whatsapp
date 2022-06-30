

const fs = require('fs');
const { MessageMedia, Buttons } = require('whatsapp-web.js');
const { cleanNumber } = require('./handle')
const DELAY_TIME = 170; //ms
const DIR_MEDIA = `${__dirname}/../mediaSend`;
// import { Low, JSONFile } from 'lowdb'
// import { join } from 'path'
const { saveMessage } = require('../adapter')
/**
 * Enviamos archivos multimedia a nuestro cliente
 * @param {*} number 
 * @param {*} fileName 
 */

const sendMedia = (client, number, fileName) => {
    number = cleanNumber(number)
    const file = `${DIR_MEDIA}/${fileName}`;
    if (fs.existsSync(file)) {
        const media = MessageMedia.fromFilePath(file);
        client.sendMessage(number, media, { sendAudioAsVoice: true });
    }
}

/**
 * notas de voz
 * @param {*} number 
 * @param {*} fileName 
 */

 const sendMediaVoiceNote = (client, number, fileName) => {
    number = cleanNumber(number)
    const file = `${DIR_MEDIA}/${fileName}`;
    if (fs.existsSync(file)) {
        const media = MessageMedia.fromFilePath(file);
        client.sendMessage(number, media ,{ sendAudioAsVoice: true });
    }
}

/**
 * mensaje simple (texto) 
 * @param {*} number 
 */
const sendMessage = async (client, number = null, text = null, trigger = null) => {
   setTimeout(async () => {
    number = cleanNumber(number)
    const message = text
    client.sendMessage(number, message);
    //await readChat(number, message, trigger);;    
   },DELAY_TIME)
}




module.exports = { sendMessage, sendMedia,  sendMediaVoiceNote }