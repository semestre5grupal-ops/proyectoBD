const Vacacion = require('../models/vacacionModel');

const getAllVacaciones = async (req, res) => {
  try {
    const vacaciones = await Vacacion.getVacaciones();
    res.status(200).json({ success: true, data: vacaciones });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVacacion = async (req, res) => {
  try {
    const vacacion = await Vacacion.getVacacionById(req.params.id);
    if (!vacacion) return res.status(404).json({ success: false, message: 'Vacación no encontrada' });
    res.status(200).json({ success: true, data: vacacion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createVacacion = async (req, res) => {
  try {
    const nuevaVacacion = await Vacacion.createVacacion(req.body);
    res.status(201).json({ success: true, data: nuevaVacacion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateVacacion = async (req, res) => {
  try {
    const vacacionActualizada = await Vacacion.updateVacacion(req.params.id, req.body);
    if (!vacacionActualizada) return res.status(404).json({ success: false, message: 'Vacación no encontrada' });
    res.status(200).json({ success: true, data: vacacionActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteVacacion = async (req, res) => {
  try {
    const vacacionEliminada = await Vacacion.deleteVacacion(req.params.id);
    if (!vacacionEliminada) return res.status(404).json({ success: false, message: 'Vacación no encontrada' });
    res.status(200).json({ success: true, message: 'Vacación eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllVacaciones, getVacacion, createVacacion, updateVacacion, deleteVacacion };
