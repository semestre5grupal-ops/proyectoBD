const CiudadModel = require('../models/ciudadModel');

exports.getAll = async (req, res) => {
    try {
        const data = await CiudadModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await CiudadModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Ciudad no encontrada.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await CiudadModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await CiudadModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Ciudad no encontrada.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await CiudadModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Ciudad no encontrada.' });
        res.status(200).json({ success: true, message: 'Ciudad eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
