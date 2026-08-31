// Employee data access layer, backed by the existing MySQL `employees` table.
// All queries are parameterized — never concatenate user input into SQL.
const pool = require("../config/db");
const { buildImageUrl } = require("../utils/cloudfront");

// Maps a MySQL `employees` row onto the shape the rest of the app expects,
// and derives imageUrl from image_key + CLOUDFRONT_DOMAIN (never stored in MySQL).
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    employeeId: row.employee_id,
    fullName: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    position: row.position,
    password: row.password,
    image_key: row.image_key || null,
    imageUrl: buildImageUrl(row.image_key)
  };
}

async function getAllUsers() {
  const [rows] = await pool.query("SELECT * FROM employees");
  return rows.map(mapRow);
}

async function findByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM employees WHERE email = ? LIMIT 1", [email]);
  return mapRow(rows[0]);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM employees WHERE id = ? LIMIT 1", [id]);
  return mapRow(rows[0]);
}

async function findByEmployeeId(employeeId) {
  const [rows] = await pool.query("SELECT * FROM employees WHERE employee_id = ? LIMIT 1", [employeeId]);
  return mapRow(rows[0]);
}

async function addUser({ employeeId, fullName, email, phone, department, position, password, image_key }) {
  const [result] = await pool.query(
    `INSERT INTO employees (employee_id, name, email, phone, department, position, password, image_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [employeeId, fullName, email, phone, department, position, password, image_key || null]
  );
  return findById(result.insertId);
}

module.exports = {
  getAllUsers,
  findByEmail,
  findById,
  findByEmployeeId,
  addUser
};
