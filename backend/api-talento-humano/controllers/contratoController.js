const Contrato = require('../models/contratoModel');

const getAllContratos = async (req, res) => {
  try {
    const data = await Contrato.getContratos();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getContrato = async (req, res) => {
  try {
    const data = await Contrato.getContratoById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createContrato = async (req, res) => {
  try {
    const newData = await Contrato.createContrato(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateContrato = async (req, res) => {
  try {
    const updatedData = await Contrato.updateContrato(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteContrato = async (req, res) => {
  try {
    const deletedData = await Contrato.deleteContrato(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    res.status(200).json({ success: true, message: 'Contrato eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllContratos,
  getContrato,
  updateContrato,
  deleteContrato,
  createContrato
};
