const LogisticaModel = require('../models/logisticaModel');

exports.getAll = async (req, res) => {
    try {
        const data = await LogisticaModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await LogisticaModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Registro de logistica no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByDocumento = async (req, res) => {
    try {
        const data = await LogisticaModel.getByDocumento(req.params.idDocumento);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await LogisticaModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await LogisticaModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Registro de logistica no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await LogisticaModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Registro de logistica no encontrado.' });
        res.status(200).json({ success: true, message: 'Registro de logistica eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
