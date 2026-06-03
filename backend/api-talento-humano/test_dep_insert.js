const { pool } = require('./config/db');
const dependientesModel = require('./models/dependientesModel');

async function test() {
  try {
    const res = await dependientesModel.createDependientes({
        id_empleado: 1,
        dep_ceddoc: '1234567890',
        dep_nom1: 'Test',
        dep_nom2: '',
        dep_ap1: 'Test',
        dep_ap2: '',
        dep_fechanacimiento: new Date().toISOString(),
        dep_sexo: 'M',
        dep_parentesco: 'Hijo/a',
        dep_estado: 'ACT'
    });
    console.log("Success:", res);
    
    await dependientesModel.deleteDependientes(res.id_dependiente);
    process.exit(0);
  } catch (err) {
    console.error("Error inserting:", err.message);
    process.exit(1);
  }
}

test();
