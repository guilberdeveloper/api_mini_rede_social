const express = require("express");
const bcrypt = require('bcrypt');
const saltRounds = 10; // Número de saltos para gerar a senha
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const { sql } = require('../db');
require('dotenv').config();

const tokenSecret = process.env.TOKEN_SECRET;

// Objeto para armazenar informações dos usuários logados
const usuariosLogados = {};

// Configuração do armazenamento de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Define o diretório de destino para salvar a foto
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Define o nome do arquivo como uma combinação de data e nome original
    }
});

// Inicializar o middleware de upload com as configurações de armazenamento
const upload = multer({ storage: storage });
const fs = require('fs'); // Importe o módulo fs para trabalhar com arquivos


// Rota de cadastro


router.post("/cadastro", upload.single('fotoUsuario'), async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    let fotoUsuario = ''; // Inicializa com uma string vazia por padrão
    if (req.file) {
        fotoUsuario = req.file.path; // Caminho do arquivo de foto enviado via upload
    }

    try {
        // Gera o hash da senha
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insere o novo usuário no banco de dados
        await sql`
            INSERT INTO usuario (name, email, password, fotoUsuario)
            VALUES (${name}, ${email}, ${hashedPassword}, ${fotoUsuario})
        `;
        res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error('Erro ao gerar hash da senha:', error);
        return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Verifica se o email e a senha foram fornecidos
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        // Consulta o banco de dados para encontrar o usuário com o email fornecido
        const users = await sql`
            SELECT id, name, email, fotoUsuario, password
            FROM usuario
            WHERE email = ${email}
        `;
        
        // Verifica se o usuário foi encontrado
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = users[0];

        // Compara a senha fornecida com a senha armazenada no banco de dados
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Cria um token JWT
        const token = jwt.sign({ userId: user.id, email: user.email }, tokenSecret, { expiresIn: '1h' });

        // Adiciona o usuario ao objeto de usuarios logados e armazena sua conexão
        usuariosLogados[user.id] = {
            id: user.id,
            name: user.name,
            email: user.email,
            foto: user.fotoUsuario,
            token: token,
            socket: req.socket // Armazena a conexão do socket
        };

        // Retorna o ID, nome, foto e token
        res.json({ id: user.id, name: user.name, fotoUsuario: user.fotoUsuario, token });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        return res.status(500).json({ error: 'Erro ao realizar login' });
    }
});


// Função para pesquisar pessoas pelo nome ou pela primeira letra do nome
async function buscarPessoasPorNome(name) {
    try {
        // Consulta SQL para pesquisar pessoas pelo nome
        const pessoas = await sql`
            SELECT *
            FROM usuario
            WHERE name ILIKE '%' || ${name} || '%'
        `;
        return pessoas;
    } catch (error) {
        throw error;
    }
}

// Rota para pesquisar pessoas pelo nome ou pela primeira letra do nome
router.get('/pessoas', async (req, res) => {
    const name = req.query.name;
    if (!name) {
        res.status(400).send('O parâmetro "nome" é obrigatório');
        return;
    }

    try {
        const pessoas = await buscarPessoasPorNome(name);
        res.json(pessoas);
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        res.status(500).send('Erro ao buscar pessoas');
    }
});


router.post("/addAmigo", async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        // Adiciona amigo na tabela amigos
        await sql`
            INSERT INTO amigos (usuario_id, amigo_id) VALUES (${userId}, ${friendId})
        `;

        // Obtém o ID do amigo recém-adicionado
        const amigoId = friendId;

        // Cria tabela de chat
        const createChatTableQuery = `
            CREATE TABLE IF NOT EXISTS chat_${amigoId} (
                id SERIAL PRIMARY KEY,
                usuario_id INT,
                amigo_id INT,
                mensagem TEXT,
                data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql(createChatTableQuery);

        res.status(200).json({ message: 'Amigo adicionado com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar amigo:', error);
        res.status(500).json({ error: 'Erro ao adicionar amigo' });
    }
});


router.get("/amigos/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const amigos = await sql`
            SELECT amigos.amigo_id, usuario.name
            FROM amigos
            INNER JOIN usuario ON amigos.amigo_id = usuario.id
            WHERE amigos.usuario_id = ${userId}
        `;
        res.json(amigos);
    } catch (error) {
        console.error('Erro ao buscar amigos:', error);
        res.status(500).json({ error: 'Erro ao buscar amigos' });
    }
});



// mostrar foto do usuario
router.get("/foto/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        // Consulta o banco de dados para obter o blob contendo o caminho do arquivo da foto do usuário
        const results = await sql`
            SELECT fotoUsuario FROM usuario WHERE id = ${userId}
        `;

        // Verifica se o usuário foi encontrado
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const fotoUsuarioBlob = results[0].fotoUsuario;

        // Extrair o caminho do blob
        const caminhoArquivo = fotoUsuarioBlob.toString();

        // Encontrar o caminho absoluto do arquivo
        const caminhoRelativo = `../${caminhoArquivo}`;
        const caminhoAbsoluto = path.join(__dirname, caminhoRelativo);

        // Envie o arquivo de foto do usuário como resposta
        res.sendFile(caminhoAbsoluto);
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        return res.status(500).json({ error: 'Erro ao obter a foto do usuário' });
    }
});


// Rota para os usuários fazerem publicações
router.post("/publicacoes", async (req, res) => {
    const { userId, texto } = req.body;

    // Verifica se o usuário forneceu um texto para a publicação
    if (!texto) {
        return res.status(400).json({ error: 'O texto da publicação é obrigatório' });
    }

    try {
        // Consulta o nome do usuário com base no ID fornecido
        const user = await sql`
            SELECT name FROM usuario WHERE id = ${userId}
        `;

        // Verifica se o usuário foi encontrado
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userName = user[0].name;

        // Insira a publicação no banco de dados com o nome do usuário
        await sql`
            INSERT INTO publicacoes (usuario_id, nome_usuario, texto)
            VALUES (${userId}, ${userName}, ${texto})
        `;
        res.status(201).json({ message: 'Publicação cadastrada com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar publicação:', error);
        return res.status(500).json({ error: 'Erro ao cadastrar publicação' });
    }
});

// Rota para buscar todas as publicações com o ID do usuário e o nome do usuário
router.get("/publicacoes", async (req, res) => {
    try {
        // Consulta todas as publicações, o ID do usuário correspondente e o nome do usuário no banco de dados
        const publicacoes = await sql`
            SELECT publicacoes.*, usuario.id AS userId, usuario.name AS userName
            FROM publicacoes
            INNER JOIN usuario ON publicacoes.usuario_id = usuario.id
        `;
        res.status(200).json(publicacoes);
    } catch (error) {
        console.error('Erro ao buscar publicações:', error);
        return res.status(500).json({ error: 'Erro ao buscar publicações' });
    }
});


// Rota para adicionar um like a uma publicação
router.post("/likes", async (req, res) => {
    const { usuarioCurtiuId, usuarioPublicouId, publicacaoId } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!usuarioCurtiuId || !usuarioPublicouId || !publicacaoId) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        // Insira o like no banco de dados
        await sql`
            INSERT INTO likes (usuario_curtiu_id, usuario_publicou_id, publicacao_id)
            VALUES (${usuarioCurtiuId}, ${usuarioPublicouId}, ${publicacaoId})
        `;
        res.status(201).json({ message: 'Like adicionado com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar like:', error);
        return res.status(500).json({ error: 'Erro ao adicionar like' });
    }
});


// Rota para remover um like de uma publicação
router.delete("/likes/:likeId", async (req, res) => {
    const likeId = req.params.likeId;

    // Verifica se o ID do like foi fornecido
    if (!likeId) {
        return res.status(400).json({ error: 'O ID do like é obrigatório' });
    }

    try {
        // Remove o like do banco de dados
        await sql`
            DELETE FROM likes WHERE id = ${likeId}
        `;
        res.status(200).json({ message: 'Like removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover like:', error);
        return res.status(500).json({ error: 'Erro ao remover like' });
    }
});


// Rota para verificar se um usuário já é amigo de outro
router.get('/checkAmigo', async (req, res) => {
    const { userId, friendId } = req.query;

    try {
        // Consulta o banco de dados para verificar se existe uma entrada na tabela amigos
        const [result] = await sql`
            SELECT COUNT(*) AS count FROM amigos WHERE usuario_id = ${userId} AND amigo_id = ${friendId}
        `;

        // Verifica se o usuário já é amigo do outro
        const isFriend = result.count > 0;
        res.json({ isFriend });
    } catch (error) {
        console.error('Erro ao verificar se é amigo:', error);
        return res.status(500).json({ error: 'Erro ao verificar se é amigo' });
    }
});

module.exports = router;
