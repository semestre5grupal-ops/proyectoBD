const Asistencia = require('../models/asistenciaModel');

const getAllAsistencias = async (req, res) => {
  try {
    const data = await Asistencia.getAsistencias();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAsistencia = async (req, res) => {
  try {
    const data = await Asistencia.getAsistenciaById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Asistencia no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createAsistencia = async (req, res) => {
  try {
    const newData = await Asistencia.createAsistencia(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateAsistencia = async (req, res) => {
  try {
    const updatedData = await Asistencia.updateAsistencia(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Asistencia no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteAsistencia = async (req, res) => {
  try {
    const deletedData = await Asistencia.deleteAsistencia(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Asistencia no encontrado' });
    res.status(200).json({ success: true, message: 'Asistencia eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllAsistencias,
  getAsistencia,
  updateAsistencia,
  deleteAsistencia,
  createAsistencia
};
