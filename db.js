const mysql = require('mysql');

// Configurações de conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'adaptable-prod.database.windows.net',
  user: 'friendzone-main-db-0fc740680a2dc15a3',
  password: 'FtyxnXnB3GMYzSCpVnesj9bzVhCPkJ',
  database: 'friendzone-main-db-0fc740680a2dc15a3',
  port: 1433,
  ssl: true // Defina como true se a conexão exigir SSL
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



// Defina os scripts de migração para criar as tabelas
const migrationScripts = [
  `
  CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fotoUsuario BLOB
)
  `,
  `
  CREATE TABLE IF NOT EXISTS amigos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      amigo_id INT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id),
      FOREIGN KEY (amigo_id) REFERENCES usuario(id)
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS publicacoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nome_usuario VARCHAR(255) NOT NULL,
      texto TEXT NOT NULL,
      data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_curtiu_id INT NOT NULL,
      usuario_publicou_id INT NOT NULL,
      publicacao_id INT NOT NULL,
      FOREIGN KEY (usuario_curtiu_id) REFERENCES usuario(id),
      FOREIGN KEY (usuario_publicou_id) REFERENCES usuario(id),
      FOREIGN KEY (publicacao_id) REFERENCES publicacoes(id)
  )
  `,
  // Adicione scripts de migração para outras tabelas aqui, se necessário
];

// Execute os scripts de migração para criar as tabelas
migrationScripts.forEach((script, index) => {
  connection.query(script, (err, results) => {
    if (err) {
      console.error(`Erro ao criar a tabela ${index + 1}:`, err);
      return;
    }
    console.log(`Tabela ${index + 1} criada com sucesso`);
  });
});

// Encerre a conexão com o banco de dados após a execução dos scripts
connection.end();

// Exportar a conexão e a função de conexão para serem utilizadas em outros arquivos
module.exports = { connection, conectarBanco };
