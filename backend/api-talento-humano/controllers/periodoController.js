const Periodo = require('../models/periodoModel');

const getAllPeriodos = async (req, res) => {
  try {
    const data = await Periodo.getPeriodos();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPeriodo = async (req, res) => {
  try {
    const data = await Periodo.getPeriodoById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createPeriodo = async (req, res) => {
  try {
    const newData = await Periodo.createPeriodo(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePeriodo = async (req, res) => {
  try {
    const updatedData = await Periodo.updatePeriodo(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deletePeriodo = async (req, res) => {
  try {
    const deletedData = await Periodo.deletePeriodo(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    res.status(200).json({ success: true, message: 'Periodo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllPeriodos,
  getPeriodo,
  updatePeriodo,
  deletePeriodo,
  createPeriodo
};
