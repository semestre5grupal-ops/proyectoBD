const Empleado = require('./models/empleadoModel');
(async () => {
  try {
    const res = await Empleado.getEmpleados({ page: 1, limit: 20 });
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit();
})();
