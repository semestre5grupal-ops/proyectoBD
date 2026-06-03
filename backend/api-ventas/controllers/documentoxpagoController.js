const DocumentoxpagoModel = require('../models/documentoxpagoModel');

exports.getAll = async (req, res) => {
    try {
        const data = await DocumentoxpagoModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByDocumento = async (req, res) => {
    try {
        const data = await DocumentoxpagoModel.getByDocumento(req.params.idDocumento);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { idDocumento, idMetodopago } = req.params;
        const data = await DocumentoxpagoModel.getOne(idDocumento, idMetodopago);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await DocumentoxpagoModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { idDocumento, idMetodopago } = req.params;
        const data = await DocumentoxpagoModel.update(idDocumento, idMetodopago, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { idDocumento, idMetodopago } = req.params;
        const data = await DocumentoxpagoModel.delete(idDocumento, idMetodopago);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, message: 'Registro eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
