const Detallehorario = require('../models/detallehorarioModel');

const getAllDetallehorarios = async (req, res) => {
  try {
    const data = await Detallehorario.getDetallehorarios();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDetallehorario = async (req, res) => {
  try {
    const data = await Detallehorario.getDetallehorarioById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Detallehorario no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createDetallehorario = async (req, res) => {
  try {
    const newData = await Detallehorario.createDetallehorario(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateDetallehorario = async (req, res) => {
  try {
    const updatedData = await Detallehorario.updateDetallehorario(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Detallehorario no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteDetallehorario = async (req, res) => {
  try {
    const deletedData = await Detallehorario.deleteDetallehorario(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Detallehorario no encontrado' });
    res.status(200).json({ success: true, message: 'Detallehorario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllDetallehorarios,
  getDetallehorario,
  updateDetallehorario,
  deleteDetallehorario,
  createDetallehorario
};
