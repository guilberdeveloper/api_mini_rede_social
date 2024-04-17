const express = require("express");
const { createServer } = require("http");
const { Server } = require("ws");
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const Amigo = require('./models/Amigo');
const Publicacao = require('./models/Publicacao');
const PORT = process.env.PORT || 3000;


// Configurações do Express
const app = express();
const httpServer = createServer(app);
const wss = new Server({ server: httpServer });

// Middleware para habilitar o corpo da solicitação JSON
app.use(express.json());

// Configuração do CORS para o Express
const cors = require("cors");
app.use(cors());

// Mapa para armazenar as conexões WebSocket dos usuários
const userConnections = {};

// Função para encontrar amigos de um usuário pelo ID
async function findUserFriends(userId) {
  try {
    const friends = await Amigo.find({ usuario_id: userId }).populate('amigo_id', 'name');
    return friends.map(friend => ({ id: friend.amigo_id._id, name: friend.amigo_id.name }));
  } catch (error) {
    throw error;
  }
}

// Função para buscar o nome do usuário pelo ID
async function findUserName(userId) {
  try {
    const user = await Usuario.findById(userId);
    if (user) {
      return user.name;
    } else {
      throw new Error("Usuário não encontrado com o ID fornecido");
    }
  } catch (error) {
    throw error;
  }
}

// Conexão WebSocket
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
app.use("/api", publicRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

httpServer.listen(`${PORT}`, () => {
  console.log(`Servidor está rodando na porta ${PORT}`);
});
