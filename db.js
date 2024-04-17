const mongoose = require('mongoose');

// Configurações de conexão com o banco de dados
mongoose.connect('mongodb://127.0.0.1:27017/mini_rede_social', { useNewUrlParser: true, useUnifiedTopology: true });

// Obter a conexão padrão do Mongoose
const connection = mongoose.connection;

// Evento de conexão bem-sucedida
connection.once('open', () => {
    console.log('Conexão bem-sucedida');
});

// Evento de erro de conexão
connection.on('error', err => {
    console.error('Erro ao conectar:', err);
});

// Exportar a conexão para ser utilizada em outros arquivos
module.exports = connection;
