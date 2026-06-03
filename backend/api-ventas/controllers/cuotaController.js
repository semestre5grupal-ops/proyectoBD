const CuotaModel = require('../models/cuotaModel');

exports.getAll = async (req, res) => {
    try {
        const data = await CuotaModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await CuotaModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Cuota no encontrada.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByDocumento = async (req, res) => {
    try {
        const data = await CuotaModel.getByDocumento(req.params.idDocumento);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await CuotaModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await CuotaModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Cuota no encontrada.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await CuotaModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Cuota no encontrada.' });
        res.status(200).json({ success: true, message: 'Cuota eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
