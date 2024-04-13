// Importações necessárias
const express = require("express");
const { createServer } = require("http");
const { Server } = require("ws");
const { connection, conectarBanco } = require('./db');
const PORT = process.env.PORT || 3000;
// Conecta ao banco de dados
conectarBanco();

const bodyParser = require('body-parser');
const app = express();
const httpServer = createServer(app);

// habilitando o body parser
app.use(bodyParser.json());

// Habilitando CORS para o Express
const cors = require("cors");
app.use(cors());

// Configurando o CORS para o WebSocket
const wss = new Server({ server: httpServer });

// Mapa para armazenar as conexões WebSocket dos usuários
const userConnections = {};

async function findUserFriends(userId) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT amigos.amigo_id, usuario.name FROM amigos INNER JOIN usuario ON amigos.amigo_id = usuario.id WHERE amigos.usuario_id = ?', [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const friends = results.map(result => ({ id: result.amigo_id, name: result.name }));
        resolve(friends);
      }
    });
  });
}


// Função para buscar o nome do usuário pelo ID na lista de amigos
async function findUserName(userId) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT name FROM usuario WHERE id = ?', [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        // Verifica se o usuário com o ID fornecido existe
        if (results.length > 0) {
          resolve(results[0].name); // Retorna o nome do usuário encontrado
        } else {
          reject(new Error("Usuário não encontrado com o ID fornecido"));
        }
      }
    });
  });
}


/*
2 segundo codigo
async function findUserFriends(userId) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT amigos.amigo_id, usuario.name FROM amigos INNER JOIN usuario ON amigos.amigo_id = usuario.id WHERE amigos.usuario_id = ?', [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const friends = results.map(result => ({ id: result.amigo_id, name: result.name }));
        resolve(friends);
      }
    });
  });
}
*/
/*
// Função para encontrar amigos de um usuário no banco de dados
1 primeiro codigo 
async function findUserFriends(userId) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT amigo_id FROM amigos WHERE usuario_id = ?', [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const friendIds = results.map(result => result.amigo_id);
        resolve(friendIds);
      }
    });
  });
}
*/



wss.on('connection', async function connection(ws, req) {
  console.log('Cliente conectado ao servidor de WebSocket');
  const userId = req.url.split('/')[1]; // Obtém o ID do usuário da URL

  console.log('User connected:');

  // Aqui você busca o nome do usuário associado ao userId no banco de dados
  const senderName = await findUserName(userId);

  // Armazena a conexão WebSocket no mapa de conexões
  userConnections[userId] = { ws, senderName };

  // Envia a lista de amigos para o cliente recém-conectado
  const friendIds = await findUserFriends(userId);
  ws.send(JSON.stringify({ friends: friendIds }));

  ws.on('message', async function incoming(message) {
    console.log('Recebido: %s', message);
    const data = JSON.parse(message);
    // Verifica se a mensagem é para mandar para outro usuário
    if (data.receiver && userConnections[data.receiver]) {
      // Adiciona o ID e o nome do remetente à mensagem
      const messageWithSenderInfo = {
        senderId: userId, // Adiciona o ID do remetente
        senderName: userConnections[userId].senderName, // Adiciona o nome do remetente
        receiver: data.receiver,
        message: data.message
      };

      // Envia a mensagem para o destinatário
      userConnections[data.receiver].ws.send(JSON.stringify(messageWithSenderInfo));

      // Verifica se o destinatário está online
      if (userConnections[data.receiver].ws !== ws) {
        // Envia uma notificação de nova mensagem para o destinatário
        userConnections[data.receiver].ws.send(JSON.stringify({
          notification: true,
          sender: userId, // Adiciona o ID do remetente
          senderName: userConnections[userId].senderName, // Adiciona o nome do remetente
          message: data.message
        }));

        // Abre o chat automaticamente para o destinatário
        const receiverUserId = data.receiver;
        const receiverWebSocket = userConnections[receiverUserId].ws;
        receiverWebSocket.send(JSON.stringify({
          openChat: true,
          sender: userId, // Adiciona o ID do remetente
          senderName: userConnections[userId].senderName, // Adiciona o nome do remetente
          receiver: data.receiver
        }));
      }
    }
  });
});





/*
wss.on('connection', async function connection(ws, req) {
  console.log('Cliente conectado ao servidor de WebSocket');
  const userId = req.url.split('/')[1]; // Obtém o ID do usuário da URL
  
  console.log('User connected:');
  
  
  // Armazena a conexão WebSocket no mapa de conexões
  userConnections[userId] = ws;

  // Encontra os amigos do usuário conectado
  const friendIds = await findUserFriends(userId);
  
  // Envia a lista de amigos para o cliente recém-conectado
  ws.send(JSON.stringify({ friends: friendIds }));

  ws.on('message', async function incoming(message) {
    console.log('Recebido: %s', message);
    const data = JSON.parse(message);
    // Verifica se a mensagem é para mandar para outro usuário
    if (data.receiver && userConnections[data.receiver]) {
      // Encontra os amigos do usuário conectado
      const friends = await findUserFriends(userId);

  
      // Adiciona o ID e o nome do remetente à mensagem
      const messageWithSenderInfo = {
        senderId: userId, // Adiciona o ID do remetente
        senderName: senderName, // Adiciona o nome do remetente
        receiver: data.receiver,
        message: data.message
      };
  
      // Envia a mensagem para o destinatário
      userConnections[data.receiver].send(JSON.stringify(messageWithSenderInfo));

      // Verifica se o destinatário está online
      if (userConnections[data.receiver] !== ws) {
        // Envia uma notificação de nova mensagem para o destinatário
        userConnections[data.receiver].send(JSON.stringify({
          notification: true,
          sender: userId, // Adiciona o ID do remetente
          message: data.message
          
        }));

        // Abre o chat automaticamente para o destinatário
        const receiverUserId = data.receiver;
        const receiverWebSocket = userConnections[receiverUserId];
        receiverWebSocket.send(JSON.stringify({
          openChat: true,
          sender: userId, // Adiciona o ID do remetente
          receiver: data.receiver
          
        }));
      }
    }
  });

  ws.on('close', function close() {
    // Remove a conexão do mapa de conexões ao desconectar
    delete userConnections[userId];
  });
});

*/



/*
wss.on('connection', async function connection(ws, req) {
  console.log('Cliente conectado ao servidor de WebSocket');
  const userId = req.url.split('/')[1]; // Obtém o ID do usuário da URL
  
  // Armazena a conexão WebSocket no mapa de conexões
  userConnections[userId] = ws;

  // Encontra os amigos do usuário conectado
  const friendIds = await findUserFriends(userId);
  
  // Envia a lista de amigos para o cliente recém-conectado
  ws.send(JSON.stringify({ friends: friendIds }));

  ws.on('message', async function incoming(message) {
    console.log('Recebido: %s', message);
    const data = JSON.parse(message);
    // Verifica se a mensagem é para mandar para outro usuário
    if (data.receiver && userConnections[data.receiver]) {
      // Envia a mensagem para o destinatário
      userConnections[data.receiver].send(JSON.stringify({
        sender: data.sender,
        message: data.message
      }));

      // Verifica se o destinatário está online
      if (userConnections[data.receiver] !== ws) {
        // Envia uma notificação de nova mensagem para o destinatário
        userConnections[data.receiver].send(JSON.stringify({
          notification: true,
          sender: data.sender,
          message: data.message
        }));

        // Abre o chat automaticamente para o destinatário
        const receiverUserId = data.receiver;
        const receiverWebSocket = userConnections[receiverUserId];
        receiverWebSocket.send(JSON.stringify({
          openChat: true,
          sender: data.sender,
          receiver:data.receiver
        }));
      }
    }
  });

  ws.on('close', function close() {
    //console.log('Cliente desconectado');
    // Remove a conexão do mapa de conexões ao desconectar
    delete userConnections[userId];
  });
});

*/







// Rota para enviar mensagem para outro usuário
app.post("/send-message", async (req, res) => {
  const { sender, receiver, message } = req.body;
  // Verifica se o destinatário está online
  if (userConnections[receiver]) {
    // Envia a mensagem para o destinatário
    userConnections[receiver].send(JSON.stringify({ sender, message }));
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Destinatário não encontrado ou offline." });
  }
});

// Rota para servir fotos estáticas
app.use('/user-photos', express.static('./uploads'));

// rotas Publicas
const publicRoutes = require("./routes/publicRoutes");
const { userInfo } = require("os");
app.use("/api", publicRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

httpServer.listen(`${PORT}`, () => {
  console.log("Servidor está rodando na porta 3000");
});
