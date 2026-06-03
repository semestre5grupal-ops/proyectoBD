const MetodoPagoModel = require('../models/metodoPagoModel');

exports.getAll = async (req, res) => {
    try {
        const data = await MetodoPagoModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await MetodoPagoModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Metodo de pago no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await MetodoPagoModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await MetodoPagoModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Metodo de pago no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await MetodoPagoModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Metodo de pago no encontrado.' });
        res.status(200).json({ success: true, message: 'Metodo de pago eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
