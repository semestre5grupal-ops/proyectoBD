const Rol = require('../models/rolModel');

const getAllRoles = async (req, res) => {
  try {
    const roles = await Rol.getRoles();
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRol = async (req, res) => {
  try {
    const rol = await Rol.getRolById(req.params.id);
    if (!rol) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    res.status(200).json({ success: true, data: rol });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRol = async (req, res) => {
  try {
    const nuevoRol = await Rol.createRol(req.body);
    res.status(201).json({ success: true, data: nuevoRol });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateRol = async (req, res) => {
  try {
    const rolActualizado = await Rol.updateRol(req.params.id, req.body);
    if (!rolActualizado) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    res.status(200).json({ success: true, data: rolActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteRol = async (req, res) => {
  try {
    const rolEliminado = await Rol.deleteRol(req.params.id);
    if (!rolEliminado) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    res.status(200).json({ success: true, message: 'Rol eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllRoles, getRol, createRol, updateRol, deleteRol };
