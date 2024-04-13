const mysql = require('mysql');

// Configurações de conexão com o banco de dados
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mini_rede_social'
});

// Função para conectar ao banco de dados
function conectarBanco() {
    connection.connect((err) => {
        if (err) {
            console.error('Erro ao conectar: ' + err.stack);
            return;
        }
        console.log('Conexão bem-sucedida');
    });
}

// Exportar a conexão e a função de conexão para serem utilizadas em outros arquivos
module.exports = { connection, conectarBanco };
