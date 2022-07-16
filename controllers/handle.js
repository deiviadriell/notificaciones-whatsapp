const { LocalAuth } = require('whatsapp-web.js');
const http = require('http'); // or 'https' for https:// URLs
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');


const cleanNumber = (number) => {
    number = number.replace('@c.us', '');
    number = `${number}@c.us`;
    number = number.replace('+', '');
    return number
}


/**
 * 
 *
 * @param {*} cb 
 */
function createClient (id)  {

    return new Promise(resolve => {         
            const client = {
                restartOnAuthFail: true,
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process', // <- this one doesn't works in Windows
                        '--disable-gpu'
                    ],
                },
                authStrategy: new LocalAuth({
                    clientId: id
                })
            }
            resolve(client)    
    });
    
}

const isValidNumber = (rawNumber) => {
    const regexGroup = /\@g.us\b/gm;
    const exist = rawNumber.match(regexGroup);
    return !exist
}

module.exports = { cleanNumber,  createClient, isValidNumber }