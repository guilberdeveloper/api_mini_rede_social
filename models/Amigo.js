const mongoose = require('mongoose');

// Definição do esquema do amigo
const amigoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    amigo_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
});

// Modelo do amigo
const Amigo = mongoose.model('Amigo', amigoSchema);

module.exports = Amigo;
