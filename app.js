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

const createSession = function (id, description) {  
  client = new Client(createClient(id));
  client.initialize();
  client.on('qr', (qr) => {        
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('estado', "desconectado");
      io.emit('qr', url);
    });
  });

  client.on('ready', () => {
    io.emit('estadoReady', 'conectado');
    const savedSessions = getSessionsFile();    
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    if (sessionIndex == -1) {
      savedSessions.push({
        id: id,
        description: description,
        ready: true,
      });
      setSessionsFile(savedSessions);
    }    
    io.emit('info', {
      usuario: client.info.pushname,
      numero: client.info.wid.user,
      sistemaOperativo: client.info.platform,
      estado: true
     });    
  });

  client.on('authenticated', () => {
    loadRoutes(client)    
    io.emit('estado', 'conectado');
  });

  client.on('auth_failure', function (session) {
    io.emit('estado', 'error');
  });

  client.on('disconnected', (reason) => {
    console.log('se desconectó')
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
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {          
      savedSessions.forEach((e, i, arr) => {
        arr[i].ready = false;
      });
      socket.emit('estado', "init");
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id, sess.description);
      });
    }
  }
}

init();

// Socket IO
io.on('connection', socket => {  
  init(socket);
  socket.on('create-session', (data) => {    
    createSession(data.id, data.description);
  });
});


  /**
   * Cargamos rutas de express!!!!!!
   */

  const loadRoutes = (client) => {    
    app.use('/api/', middlewareClient(client), require('./routes/api'))
  }


  server.listen(port, () => {
    console.log(`El server esta listo por el puerto ${port}`);
  })  
