const DocumentoModel = require('../models/documentoModel');

exports.getAll = async (req, res) => {
    try {
        const data = await DocumentoModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await DocumentoModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Documento no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByCliente = async (req, res) => {
    try {
        const data = await DocumentoModel.getByCliente(req.params.idCliente);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await DocumentoModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await DocumentoModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Documento no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await DocumentoModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Documento no encontrado.' });
        res.status(200).json({ success: true, message: 'Documento eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
