const Rubros = require('../models/rubrosModel');

const getAllRubross = async (req, res) => {
  try {
    const data = await Rubros.getRubross();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRubros = async (req, res) => {
  try {
    const data = await Rubros.getRubrosById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Rubros no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRubros = async (req, res) => {
  try {
    const newData = await Rubros.createRubros(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateRubros = async (req, res) => {
  try {
    const updatedData = await Rubros.updateRubros(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Rubros no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteRubros = async (req, res) => {
  try {
    const deletedData = await Rubros.deleteRubros(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Rubros no encontrado' });
    res.status(200).json({ success: true, message: 'Rubros eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllRubross,
  getRubros,
  updateRubros,
  deleteRubros,
  createRubros
};
