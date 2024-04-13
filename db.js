const mysql = require('mysql');

// Configurações de conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'adaptable-prod.database.windows.net',
    user: 'friendzone-main-db-0fc740680a2dc15a3',
    password: 'FtyxnXnB3GMYzSCpVnesj9bzVhCPkJ',
    database: 'friendzone-main-db-0fc740680a2dc15a3',
    port: 1433
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
