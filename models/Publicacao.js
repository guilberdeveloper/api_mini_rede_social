const mongoose = require('mongoose');

// Definição do esquema da publicação
const publicacaoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nome_usuario: {
        type: String,
        required: true
    },
    texto: {
        type: String,
        required: true
    },
    data: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    deslike: {
        type: Number,
        default: 0
    },
    comentarios: [{
        texto: {
            type: String,
            required: true
        },
        usuario_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        nome_usuario: {
            type: String,
            required: true
        },
        data: {
            type: Date,
            default: Date.now
        }
    }]
});

// Modelo da publicação
const Publicacao = mongoose.model('Publicacao', publicacaoSchema);

module.exports = Publicacao;
