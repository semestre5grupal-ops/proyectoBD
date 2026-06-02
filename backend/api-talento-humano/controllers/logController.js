const Log = require('../models/logModel');

const getAllLogs = async (req, res) => {
  try {
    const data = await Log.getLogs();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLog = async (req, res) => {
  try {
    const data = await Log.getLogById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Log no encontrado' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createLog = async (req, res) => {
  try {
    const newData = await Log.createLog(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateLog = async (req, res) => {
  try {
    const updatedData = await Log.updateLog(req.params.id, req.body);
    if (!updatedData) return res.status(404).json({ success: false, message: 'Log no encontrado' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteLog = async (req, res) => {
  try {
    const deletedData = await Log.deleteLog(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, message: 'Log no encontrado' });
    res.status(200).json({ success: true, message: 'Log eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllLogs,
  getLog,
  updateLog,
  deleteLog,
  createLog
};
