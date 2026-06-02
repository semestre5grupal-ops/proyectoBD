const Proveedor = require('../models/proveedorModel');

const getAllProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.getProveedores();
    res.status(200).json({ success: true, data: proveedores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.getProveedorById(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ success: true, data: proveedor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createProveedor = async (req, res) => {
  try {
    const nuevoProveedor = await Proveedor.createProveedor(req.body);
    res.status(201).json({ success: true, data: nuevoProveedor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateProveedor = async (req, res) => {
  try {
    const proveedorActualizado = await Proveedor.updateProveedor(req.params.id, req.body);
    if (!proveedorActualizado) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ success: true, data: proveedorActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllProveedores,
  getProveedor,
  createProveedor,
  updateProveedor
};
