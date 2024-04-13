const User = require("../models/userModel");

// Função para criar um novo usuário
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem." });
    }
    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Usuário já existe." });
    }
    // Cria o novo usuário
    const newUser = new User({
      username,
      email,
      password,
    });
    await newUser.save();
    res.status(201).json({ message: "Usuário criado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
};
