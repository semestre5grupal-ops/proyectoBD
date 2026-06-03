// Redondeo determinista "half away from zero" usando notación exponencial.
// Evita acumulación de errores de punto flotante en operaciones monetarias.
function round(value, decimals) {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

module.exports = { round };
