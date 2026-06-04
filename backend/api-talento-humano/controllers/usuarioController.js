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
        usu_nombre: usuario.usu_nombre,
        rol_nombre: usuario.rol_nombre
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
        id_rol: usuario.id_rol,
        rol_nombre: usuario.rol_nombre
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
    let { usu_nombre, usu_contra, usu_estado, id_empleado, id_rol } = req.body;
    
    if (usu_contra) {
      const salt = await bcrypt.genSalt(10);
      usu_contra = await bcrypt.hash(usu_contra, salt);
    }

    const nuevoUsuario = await Usuario.createUsuario({ usu_nombre, usu_contra, usu_estado, id_empleado, id_rol });
    res.status(201).json({ success: true, data: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.getUsuarioById(req.params.id);
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUsuario = async (req, res) => {
  try {
    let { usu_nombre, usu_contra, usu_estado, id_empleado, id_rol } = req.body;
    
    if (usu_contra) {
      const salt = await bcrypt.genSalt(10);
      usu_contra = await bcrypt.hash(usu_contra, salt);
    }

    const usuarioActualizado = await Usuario.updateUsuario(req.params.id, { usu_nombre, usu_contra, usu_estado, id_empleado, id_rol });
    if (!usuarioActualizado) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.status(200).json({ success: true, data: usuarioActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.deleteUsuario(req.params.id);
    if (!usuarioEliminado) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  login, 
  getAllUsuarios, 
  getUsuario, 
  createUsuario, 
  updateUsuario, 
  deleteUsuario 
};
