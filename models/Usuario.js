const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fotoUsuario: {
        type: String
    }
});

const usuario = mongoose.model('usuario', usuarioSchema);

module.exports = usuario;
