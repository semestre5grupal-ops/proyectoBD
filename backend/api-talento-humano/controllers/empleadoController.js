const Empleado = require('../models/empleadoModel');

const getAllEmpleados = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await Empleado.getEmpleados({ page, limit, search });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEmpleado = async (req, res) => {
  try {
    const empleado = await Empleado.getEmpleadoById(req.params.id);
    if (!empleado) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.status(200).json({ success: true, data: empleado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createEmpleado = async (req, res) => {
  try {
    const nuevoEmpleado = await Empleado.createEmpleado(req.body);
    res.status(201).json({ success: true, data: nuevoEmpleado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateEmpleado = async (req, res) => {
  try {
    const empleadoActualizado = await Empleado.updateEmpleado(req.params.id, req.body);
    if (!empleadoActualizado) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.status(200).json({ success: true, data: empleadoActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteEmpleado = async (req, res) => {
  try {
    const empleadoEliminado = await Empleado.deleteEmpleado(req.params.id);
    if (!empleadoEliminado) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.status(200).json({ success: true, message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllEmpleados,
  getEmpleado,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
};
