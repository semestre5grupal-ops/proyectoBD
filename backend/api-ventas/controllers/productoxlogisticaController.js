const ProductoxlogisticaModel = require('../models/productoxlogisticaModel');

exports.getAll = async (req, res) => {
    try {
        const data = await ProductoxlogisticaModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByLogistica = async (req, res) => {
    try {
        const data = await ProductoxlogisticaModel.getByLogistica(req.params.idLogistica);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { idLogistica, idVariante } = req.params;
        const data = await ProductoxlogisticaModel.getOne(idLogistica, idVariante);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = await ProductoxlogisticaModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { idLogistica, idVariante } = req.params;
        const data = await ProductoxlogisticaModel.update(idLogistica, idVariante, req.body);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { idLogistica, idVariante } = req.params;
        const data = await ProductoxlogisticaModel.delete(idLogistica, idVariante);
        if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
        res.status(200).json({ success: true, message: 'Registro eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
