const contratoController = require('./controllers/contratoController');

const req = {
  body: {
    id_empleado: 1,
    id_cargo: 1,
    con_tipo: "T",
    con_fechainicio: "2026-06-03T00:00:00.000Z",
    con_fecha_fin: "2026-07-01T00:00:00.000Z",
    con_sueldobase: 650.00,
    con_estado: "ACT",
    con_mensualiza_d3: false,
    con_mensualiza_d4: false,
    con_mensualiza_fr: false,
    con_empfechaingreso: "2026-06-03T00:00:00.000Z"
  }
};

const res = {
  status: function(s) {
    this.statusCode = s;
    return this;
  },
  json: function(d) {
    console.log("Status:", this.statusCode);
    console.log("Response:", d);
  }
};

contratoController.createContrato(req, res);
