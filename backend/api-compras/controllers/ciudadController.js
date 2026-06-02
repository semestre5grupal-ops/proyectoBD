const Ciudad = require('../models/ciudadModel');

const getAllCiudades = async (req, res) => {
  try {
    const ciudades = await Ciudad.getCiudades();
    res.status(200).json({ success: true, data: ciudades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCiudad = async (req, res) => {
  try {
    const ciudad = await Ciudad.getCiudadById(req.params.id);
    if (!ciudad) {
      return res.status(404).json({ success: false, message: 'Ciudad no encontrada' });
    }
    res.status(200).json({ success: true, data: ciudad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createCiudad = async (req, res) => {
  try {
    const nuevaCiudad = await Ciudad.createCiudad(req.body);
    res.status(201).json({ success: true, data: nuevaCiudad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllCiudades,
  getCiudad,
  createCiudad
};
