const ProductoxdocumentoModel = require('../models/productoxdocumentoModel');

exports.getAll = async (req, res) => {
    try {
        const data = await ProductoxdocumentoModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByDocumento = async (req, res) => {
    try {
        const data = await ProductoxdocumentoModel.getByDocumento(req.params.idDocumento);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { idDocumento, idVariante } = req.params;
        const data = await ProductoxdocumentoModel.getOne(idDocumento, idVariante);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await ProductoxdocumentoModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { idDocumento, idVariante } = req.params;
        const data = await ProductoxdocumentoModel.update(idDocumento, idVariante, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { idDocumento, idVariante } = req.params;
        const data = await ProductoxdocumentoModel.delete(idDocumento, idVariante);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, message: 'Registro eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
