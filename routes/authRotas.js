const express = require("express");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();
require('dotenv').config();

// Modelos mongo
const Usuario = require("../models/Usuario");


const tokenSecret = process.env.TOKEN_SECRET;

const usuariosLogados = {};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


router.use(bodyParser.json());

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, tokenSecret, { expiresIn: '1h' });

        usuariosLogados[user.id] = {
            id: user.id,
            name: user.name,
            email: user.email,
            foto: user.fotoUsuario,
            token: token,
            socket: req.socket
        };

        res.json({ id: user.id, name: user.name, fotoUsuario: user.fotoUsuario, token });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
});



router.post("/cadastro", upload.single('fotoUsuario'), async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    let fotoUsuario = '';
    if (req.file) {
        fotoUsuario = req.file.path;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Utilizando Mongoose para inserir o novo usuário no banco de dados
        await Usuario.create({ name, email, password: hashedPassword, fotoUsuario });

        res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error('Erro ao gerar hash da senha:', error);
        return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});









module.exports = router;
