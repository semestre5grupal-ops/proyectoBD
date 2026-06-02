const Permiso = require('../models/permisoModel');

const getAllPermisos = async (req, res) => {
  try {
    const permisos = await Permiso.getPermisos();
    res.status(200).json({ success: true, data: permisos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPermiso = async (req, res) => {
  try {
    const permiso = await Permiso.getPermisoById(req.params.id);
    if (!permiso) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
    res.status(200).json({ success: true, data: permiso });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createPermiso = async (req, res) => {
  try {
    const nuevoPermiso = await Permiso.createPermiso(req.body);
    res.status(201).json({ success: true, data: nuevoPermiso });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePermiso = async (req, res) => {
  try {
    const permisoActualizado = await Permiso.updatePermiso(req.params.id, req.body);
    if (!permisoActualizado) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
    res.status(200).json({ success: true, data: permisoActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deletePermiso = async (req, res) => {
  try {
    const permisoEliminado = await Permiso.deletePermiso(req.params.id);
    if (!permisoEliminado) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
    res.status(200).json({ success: true, message: 'Permiso eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllPermisos, getPermiso, createPermiso, updatePermiso, deletePermiso };
