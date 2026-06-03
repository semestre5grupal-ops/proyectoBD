const DireccionModel = require('../models/direccionModel');

exports.getAll = async (req, res) => {
    try {
        const data = await DireccionModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await DireccionModel.getById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Direccion no encontrada.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByCliente = async (req, res) => {
    try {
        const data = await DireccionModel.getByCliente(req.params.idCliente);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await DireccionModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await DireccionModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Direccion no encontrada.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await DireccionModel.delete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Direccion no encontrada.' });
        res.status(200).json({ success: true, message: 'Direccion eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
