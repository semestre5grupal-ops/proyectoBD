const ClienteModel = require('../models/clienteModel');

exports.getAll = async (req, res) => {
    try {
        const data = await ClienteModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await ClienteModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await ClienteModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await ClienteModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await ClienteModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        res.status(200).json({ success: true, message: 'Cliente eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
