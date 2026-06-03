const Departamento = require('../models/departamentoModel');

const getAllDepartamentos = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const limitAll = req.query.limit === 'all';
    const result = await Departamento.getDepartamentos({ page, limit, search, limitAll });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDepartamento = async (req, res) => {
  try {
    const data = await Departamento.getDepartamentoById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createDepartamento = async (req, res) => {
  try {
    const newData = await Departamento.createDepartamento(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateDepartamento = async (req, res) => {
  try {
    const updatedData = await Departamento.updateDepartamento(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteDepartamento = async (req, res) => {
  try {
    const deletedData = await Departamento.deleteDepartamento(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
    res.status(200).json({ success: true, message: 'Departamento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllDepartamentos,
  getDepartamento,
  updateDepartamento,
  deleteDepartamento,
  createDepartamento
};
