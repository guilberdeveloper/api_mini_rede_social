const express = require("express");
const bodyParser = require('body-parser');
const router = express.Router();
const path = require('path');
require('dotenv').config();

// Modelos mongo
const Usuario = require("../models/Usuario");
const Amigo = require("../models/Amigo");
const Publicacao = require("../models/Publicacao");

const tokenSecret = process.env.TOKEN_SECRET;



router.use(bodyParser.json());




function buscarPessoasPorNome(name) {
    return Usuario.find({ name: { $regex: name, $options: 'i' } }, '_id name fotoUsuario');
}

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
    const { usuario_id, amigo_id } = req.body;


    try {
        await Amigo.create({ usuario_id, amigo_id });

        // Lógica para criar a tabela de chat com Mongoose

        res.status(200).json({ message: 'Amigo adicionado com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar amigo:', error);
        res.status(500).json({ error: 'Erro ao adicionar amigo' });
    }
});



router.get("/amigos/:userId", async (req, res) => {
    const userId = req.params.userId.toString(); // Converter para string
    try {
        const amigos = await Amigo.find({ usuario_id: userId }).populate('amigo_id', 'name');
        res.json(amigos);
    } catch (error) {
        console.error('Erro ao buscar amigos:', error);
        res.status(500).json({ error: 'Erro ao buscar amigos' });
    }
});


router.get("/foto/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        if (!userId) {
            return res.status(400).json({ error: 'O ID do usuário é obrigatório' });
        }

        const user = await Usuario.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const caminhoArquivo = path.resolve(user.fotoUsuario);

        // Envie o arquivo de foto do usuário como resposta
        res.sendFile(caminhoArquivo);
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        return res.status(500).json({ error: 'Erro ao obter a foto do usuário' });
    }
});


router.post("/publicacoes", async (req, res) => {
    const { userId, texto } = req.body;

    if (!texto) {
        return res.status(400).json({ error: 'O texto da publicação é obrigatório' });
    }

    try {
        const user = await Usuario.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        await Publicacao.create({ usuario_id: userId, nome_usuario: user.name, texto });

        res.status(201).json({ message: 'Publicação cadastrada com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar publicação:', error);
        return res.status(500).json({ error: 'Erro ao cadastrar publicação' });
    }
});

router.get("/publicacoes", async (req, res) => {
    try {
        const publicacoes = await Publicacao.find().populate('usuario_id', 'name');
        res.status(200).json(publicacoes);
    } catch (error) {
        console.error('Erro ao buscar publicações:', error);
        res.status(500).json({ error: 'Erro ao buscar publicações' });
    }
});

/// Rota para adicionar um like a uma publicação
router.post('/publicacoes/:id/like', async (req, res) => {
    const publicacaoId = req.params.id;
    try {
        const publicacao = await Publicacao.findById(publicacaoId);
        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada' });
        }
        // Incrementa o número de likes
        publicacao.likes++;
        await publicacao.save();
        res.json(publicacao);
    } catch (error) {
        console.error('Erro ao adicionar like:', error);
        res.status(500).json({ error: 'Erro ao adicionar like' });
    }
});

// Rota para adicionar um comentário a uma publicação
router.post('/publicacoes/:id/comentar', async (req, res) => {
    const publicacaoId = req.params.id;
    const { texto, usuario_id, nome_usuario } = req.body;
    try {
        const publicacao = await Publicacao.findById(publicacaoId);
        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada' });
        }
        // Adiciona o comentário à lista de comentários da publicação
        publicacao.comentarios.push({ texto, usuario_id, nome_usuario });
        await publicacao.save();
        res.json(publicacao);
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        res.status(500).json({ error: 'Erro ao adicionar comentário' });
    }
});


// Rota para remover um like de uma publicação
router.post('/publicacoes/:id/dislike', async (req, res) => {
    const publicacaoId = req.params.id;
    try {
        const publicacao = await Publicacao.findById(publicacaoId);
        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada' });
        }
        // Incrementa o número de likes
        publicacao.deslike++;
        await publicacao.save();
        res.json(publicacao);
    } catch (error) {
        console.error('Erro ao adicionar like:', error);
        res.status(500).json({ error: 'Erro ao adicionar like' });
    }
});



router.get('/checkAmigo', async (req, res) => {
    const { userId, friendId } = req.query;

    try {
        const count = await Amigo.countDocuments({ usuario_id: userId, amigo_id: friendId });
        const isFriend = count > 0;
        res.json({ isFriend });
    } catch (error) {
        console.error('Erro ao verificar se é amigo:', error);
        res.status(500).json({ error: 'Erro ao verificar se é amigo' });
    }
});

module.exports = router;
