const Horarioxempleado = require('../models/horarioxempleadoModel');

const getAllHorarioxempleados = async (req, res) => {
  try {
    const data = await Horarioxempleado.getHorarioxempleados();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createHorarioxempleado = async (req, res) => {
  try {
    const newData = await Horarioxempleado.createHorarioxempleado(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllHorarioxempleados,
  createHorarioxempleado
};
