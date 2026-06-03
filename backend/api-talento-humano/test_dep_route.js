const dependienteController = require('./controllers/dependientesController');

const req = {
  body: {
    id_empleado: 1,
    dep_ceddoc: "1138383458",
    dep_nom1: "Jorge",
    dep_nom2: "",
    dep_ap1: "Cordova",
    dep_ap2: "Orozco",
    dep_fechanacimiento: "2026-06-09T00:00:00.000Z",
    dep_sexo: "F",
    dep_parentesco: "Hijo/a",
    dep_estado: "ACT"
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

dependienteController.createDependientes(req, res);
