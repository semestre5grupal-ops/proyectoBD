const Cargo = require('../models/cargoModel');

const getAllCargos = async (req, res) => {
  try {
    const data = await Cargo.getCargos();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCargo = async (req, res) => {
  try {
    const data = await Cargo.getCargoById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Cargo no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createCargo = async (req, res) => {
  try {
    const newData = await Cargo.createCargo(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCargo = async (req, res) => {
  try {
    const updatedData = await Cargo.updateCargo(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Cargo no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteCargo = async (req, res) => {
  try {
    const deletedData = await Cargo.deleteCargo(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Cargo no encontrado' });
    res.status(200).json({ success: true, message: 'Cargo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllCargos,
  getCargo,
  updateCargo,
  deleteCargo,
  createCargo
};
