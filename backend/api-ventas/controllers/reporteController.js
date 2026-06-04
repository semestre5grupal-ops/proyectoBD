const ReporteService = require('../services/reporte.service');

function handleError(res, err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
}

exports.kpis = async (req, res) => {
    try {
        const data = await ReporteService.kpis();
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

exports.ventas = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).json({ success: false, message: 'Parámetros desde y hasta son requeridos.' });
        const data = await ReporteService.ventasFacturacion({ desde, hasta });
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

exports.comercial = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).json({ success: false, message: 'Parámetros desde y hasta son requeridos.' });
        const data = await ReporteService.comercial({ desde, hasta });
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

exports.clientes = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).json({ success: false, message: 'Parámetros desde y hasta son requeridos.' });
        const data = await ReporteService.clientesGeografia({ desde, hasta });
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

exports.productos = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).json({ success: false, message: 'Parámetros desde y hasta son requeridos.' });
        const data = await ReporteService.productos({ desde, hasta });
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};
