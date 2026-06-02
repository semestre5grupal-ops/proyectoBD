const Meta = require('../models/metaModel');

const getAllMetas = async (req, res) => {
  try {
    const data = await Meta.getMetas();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMeta = async (req, res) => {
  try {
    const data = await Meta.getMetaById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Meta no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createMeta = async (req, res) => {
  try {
    const newData = await Meta.createMeta(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateMeta = async (req, res) => {
  try {
    const updatedData = await Meta.updateMeta(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Meta no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteMeta = async (req, res) => {
  try {
    const deletedData = await Meta.deleteMeta(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Meta no encontrado' });
    res.status(200).json({ success: true, message: 'Meta eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllMetas,
  getMeta,
  updateMeta,
  deleteMeta,
  createMeta
};
