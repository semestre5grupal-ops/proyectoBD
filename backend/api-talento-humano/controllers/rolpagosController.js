const Rolpagos = require('../models/rolpagosModel');

const getAllRolpagoss = async (req, res) => {
  try {
    const data = await Rolpagos.getRolpagoss();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRolpagos = async (req, res) => {
  try {
    const data = await Rolpagos.getRolpagosById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Rolpagos no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRolpagos = async (req, res) => {
  try {
    const newData = await Rolpagos.createRolpagos(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateRolpagos = async (req, res) => {
  try {
    const updatedData = await Rolpagos.updateRolpagos(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Rolpagos no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteRolpagos = async (req, res) => {
  try {
    const deletedData = await Rolpagos.deleteRolpagos(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Rolpagos no encontrado' });
    res.status(200).json({ success: true, message: 'Rolpagos eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllRolpagoss,
  getRolpagos,
  updateRolpagos,
  deleteRolpagos,
  createRolpagos
};
