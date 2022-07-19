/**
 * ⚡⚡⚡ DECLARAMOS LAS LIBRERIAS y CONSTANTES A USAR!. ⚡⚡⚡
 */
require('dotenv').config()
const fs = require('fs');
const express = require('express');
const cors = require('cors')
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const { middlewareClient } = require('./middleware/client')
const { createClient,} = require('./controllers/handle')
const http = require('http');
const app = express();
let client;
const server = http.createServer(app);

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}));
const io = socketIO(server);
const port = process.env.PORT || 3000

app.use('/', require('./routes/web'))
const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));      
    } catch (err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const createSession = async (id, description) => {  
  const clientJson = await createClient(id);
  client = new Client(clientJson);
  console.log("********************************");
  console.log("Creando Cliente WhatsApp...");
  client.initialize();
  console.log("Cliente WhatsApp Inicializado...");
  
  client.on('qr', (qr) => {
    console.log("Generando Qr");
    io.emit('estado', "qr");
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('estado', "desconectado");
      io.emit('qr', url);
    });
  });

  client.on('ready', () => {
    io.emit('estado', "ready");
    console.log("Cliente Ready");
    loadRoutes(client);    
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);


  });

  client.on('authenticated', () => {
    io.emit('estado', { id: id, text: 'Whatsapp is authenticated!' });
    console.log("Whatsapp is authenticated!");
  });

  client.on('auth_failure', function (session) {
    io.emit('estado', 'error');
  });

  client.on('disconnected', (reason) => {
    console.log('Se desconectó el WhatsApp');
    io.emit('estado', 'desconectado');
    client.destroy();
    client.initialize();
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);
    io.emit('remove-session', id);
  });


  sessions.push({
    id: id,
    description: description,
    client: client
  });


  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
}

const init = function(socket) {  
  io.emit('estado', "init");
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {          
      savedSessions.forEach((e, i, arr) => {
        arr[i].ready = false;
      });
      
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id, sess.description);
      });
    }
  }
}
try {
  init();
  
} catch (error) {
  init();
  
}


// Socket IO
io.on('connection', socket => {  
  init(socket);
  socket.on('create-session', (data) => {    
    createSession(data.id, data.description);
  });

  socket.on('disconnect', () => {    
    console.log("Se desconectó el FrontEnd")
  });
});


  /**
   * Cargamos rutas de express!!!!!!
   */

  const loadRoutes = (client) => {    
    app.use('/api/', middlewareClient(client), require('./routes/api'))   
    io.emit('estado', "loadedRoutes");
    console.log("Rutas Cargadas");
  }


  server.listen(port, () => {
    console.log(`El server esta listo por el puerto ${port}`);
  })  

