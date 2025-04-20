import db from '../database/db.js';

class Officer {
  constructor(officer) {
    this.officerId = officer.officerId;
    this.name = officer.name;
    this.badge = officer.badge;
    this.branch = officer.branch;
    this.area = officer.area;
    this.position = officer.position;
    this.contactInfo = officer.contactInfo;
    this.createdAt = officer.createdAt;
    this.updatedAt = officer.updatedAt;
  }

  async save() {
    const sql = `
      UPDATE officers 
      SET name = ?, badge = ?, branch = ?, area = ?, 
          position = ?, contactInfo = ?, updatedAt = NOW()
      WHERE officerId = ?`;

    await db.execute(sql, [
      this.name,
      this.badge,
      this.branch,
      this.area,
      this.position,
      this.contactInfo,
      this.officerId
    ]);
  }

  static async create(officerData) {
    const sql = `
      INSERT INTO officers (name, badge, branch, area, position, contactInfo, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const [result] = await db.execute(sql, [
      officerData.name,
      officerData.badge,
      officerData.branch,
      officerData.area,
      officerData.position,
      officerData.contactInfo
    ]);
    return await Officer.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM officers WHERE officerId = ?', [id]);
    if (rows.length === 0) return null;
    return new Officer(rows[0]);
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM officers');
    return rows.map(row => new Officer(row));
  }

  static async deleteById(id) {
    await db.execute('DELETE FROM officers WHERE officerId = ?', [id]);
  }
}

export default Officer;