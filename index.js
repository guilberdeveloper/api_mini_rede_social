// Importações necessárias
const express = require("express");
const { createServer } = require("http");
const { Server } = require("ws");
const postgres = require('postgres');
const { getPgVersion } = require('./db');

// Configurações de conexão com o banco de dados PostgreSQL
const sql = postgres();

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

httpServer.listen(3000, () => {
  console.log("Servidor está rodando na porta 3000");
});
