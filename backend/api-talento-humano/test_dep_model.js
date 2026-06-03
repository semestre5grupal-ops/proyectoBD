const { pool } = require('./config/db');

const getDepartamentos = async (options = {}) => {
  const { page = 1, limit = 20, search = '', limitAll = false } = options;
  
  if (limitAll) {
    // For dropdowns, we only need id and name, and we only want active ones
    const result = await pool.query("SELECT id_departamento, dep_nombre FROM departamento WHERE dep_estado != 'INC' ORDER BY dep_nombre ASC");
    return { data: result.rows, totalRecords: result.rows.length };
  }

  const offset = (page - 1) * limit;
  let query = "SELECT * FROM departamento WHERE dep_estado != 'INC'";
  const values = [];

  if (search) {
    query += " AND dep_nombre ILIKE $1";
    values.push(`%${search}%`);
  }

  // Count total records for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
  const countResult = await pool.query(countQuery, values);
  const totalRecords = parseInt(countResult.rows[0].count, 10);

  // Add order, limit, offset
  query += " ORDER BY id_departamento DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);
  values.push(limit, offset);

  const result = await pool.query(query, values);
  
  return {
    data: result.rows,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: parseInt(page, 10)
  };
};

async function test() {
  try {
    const res = await getDepartamentos({ limitAll: true });
    console.log("Dropdown list:", res.data.length);

    const res2 = await getDepartamentos({ page: 1, limit: 2 });
    console.log("Page 1:", res2.data.length, "Total:", res2.totalRecords);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
