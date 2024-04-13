import mongoose from "mongoose";
const { Schema } = mongoose;

// Esquema para o modelo de Blog
// Esquema para o modelo de Blog
const blogSchema = new Schema({
  title: String,
  author: String,
  body: String,
  comments: [{ body: String, date: Date }],
  date: { type: Date, default: Date.now },
  hidden: Boolean,
  meta: {
    votes: Number,
    favs: Number,
  },
  authorRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referência ao modelo de usuário
  },
});

// Esquema para o modelo de Usuário
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  confirmPassword: String,
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog", // Referência ao modelo de blog
    },
  ],
});

// Modelos baseados nos esquemas
const Blog = mongoose.model("Blog", blogSchema);
const User = mongoose.model("User", userSchema);

module.exports = { Blog, User };
