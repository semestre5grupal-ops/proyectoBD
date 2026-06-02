const Dependientes = require('../models/dependientesModel');

const getAllDependientess = async (req, res) => {
  try {
    const data = await Dependientes.getDependientess();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDependientes = async (req, res) => {
  try {
    const data = await Dependientes.getDependientesById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Dependientes no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createDependientes = async (req, res) => {
  try {
    const newData = await Dependientes.createDependientes(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateDependientes = async (req, res) => {
  try {
    const updatedData = await Dependientes.updateDependientes(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Dependientes no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteDependientes = async (req, res) => {
  try {
    const deletedData = await Dependientes.deleteDependientes(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Dependientes no encontrado' });
    res.status(200).json({ success: true, message: 'Dependientes eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllDependientess,
  getDependientes,
  updateDependientes,
  deleteDependientes,
  createDependientes
};
