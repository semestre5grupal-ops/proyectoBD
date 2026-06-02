const Usuario = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    const { usu_nombre, usu_contra } = req.body;
    
    // Buscar usuario en la base de datos
    const usuario = await Usuario.getUsuarioByNombre(usu_nombre);
    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    // Validación de contraseña usando bcryptjs ya que la BD tiene hashes
    const validPassword = await bcrypt.compare(usu_contra, usuario.usu_contra);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    // Validar estado ACT
    if (usuario.usu_estado !== 'ACT') {
      return res.status(403).json({ success: false, message: 'El usuario se encuentra inactivo' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { 
        id_usuario: usuario.id_usuario, 
        id_rol: usuario.id_rol,
        usu_nombre: usuario.usu_nombre 
      },
      process.env.JWT_SECRET || 'super_secreto_para_desarrollo_local_123',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Autenticación exitosa',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        usu_nombre: usuario.usu_nombre,
        id_rol: usuario.id_rol
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.getUsuarios();
    res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUsuario = async (req, res) => {
  try {
    const nuevoUsuario = await Usuario.createUsuario(req.body);
    res.status(201).json({ success: true, data: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { login, getAllUsuarios, createUsuario };
