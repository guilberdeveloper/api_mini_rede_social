// Importa o módulo postgres
const postgres = require('postgres');

// Importa o módulo dotenv para lidar com variáveis de ambiente
require('dotenv').config();

// Extrai as variáveis de ambiente necessárias
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

// Cria uma conexão com o PostgreSQL usando o módulo postgres
const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432, // Porta padrão do PostgreSQL
  ssl: 'require', // Configuração SSL
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

// Função para obter a versão do PostgreSQL
async function getPgVersion() {
  try {
    // Executa uma consulta SQL para obter a versão do PostgreSQL
    const result = await sql`SELECT version()`;
    console.log(result); // Exibe o resultado no console
  } catch (error) {
    console.error('Erro ao obter a versão do PostgreSQL:', error); // Trata erros, se houver
  }
}

// Chama a função para obter a versão do PostgreSQL
getPgVersion();
