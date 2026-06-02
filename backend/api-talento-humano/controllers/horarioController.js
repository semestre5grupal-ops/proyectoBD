const Horario = require('../models/horarioModel');

const getAllHorarios = async (req, res) => {
  try {
    const data = await Horario.getHorarios();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getHorario = async (req, res) => {
  try {
    const data = await Horario.getHorarioById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createHorario = async (req, res) => {
  try {
    const newData = await Horario.createHorario(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateHorario = async (req, res) => {
  try {
    const updatedData = await Horario.updateHorario(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteHorario = async (req, res) => {
  try {
    const deletedData = await Horario.deleteHorario(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    res.status(200).json({ success: true, message: 'Horario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllHorarios,
  getHorario,
  updateHorario,
  deleteHorario,
  createHorario
};
