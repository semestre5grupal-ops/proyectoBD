const { pool } = require('./config/db');
const contratoModel = require('./models/contratoModel');

async function test() {
  try {
    const res = await contratoModel.createContrato({
        id_empleado: 1,
        id_cargo: 1,
        con_tipo: 'T',
        con_sueldobase: 650.00,
        con_fechainicio: new Date('2026-06-03').toISOString(),
        con_fecha_fin: new Date('2026-07-01').toISOString(),
        con_estado: 'ACT',
        con_mensualiza_d3: false,
        con_mensualiza_d4: false,
        con_mensualiza_fr: false
    });
    console.log("Success:", res);
    
    await contratoModel.deleteContrato(res.id_contrato);
    process.exit(0);
  } catch (err) {
    console.error("Error inserting:", err.message);
    process.exit(1);
  }
}

test();
