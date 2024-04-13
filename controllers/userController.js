// Importação do pacote postgres
const postgres = require('postgres');
// Criação da conexão com o banco de dados PostgreSQL
const sql = postgres();

// Função para criar um novo usuário
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem." });
    }
    // Verifica se o usuário já existe
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Usuário já existe." });
    }
    // Insere o novo usuário no banco de dados
    await sql`INSERT INTO users (username, email, password) VALUES (${username}, ${email}, ${password})`;
    res.status(201).json({ message: "Usuário criado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
};
