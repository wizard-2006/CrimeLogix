import db from '../database/db.js';

class Suspect {
  constructor(suspect) {
    this.suspectId = suspect.suspectId;
    this.name = suspect.name;
    this.address = suspect.address;
    this.phoneNumber = suspect.phoneNumber;
    this.description = suspect.description;
    this.status = suspect.status;
    this.createdAt = suspect.createdAt;
    this.updatedAt = suspect.updatedAt;
  }

  async save() {
    const sql = `
      UPDATE suspects 
      SET name = ?, address = ?, phoneNumber = ?, 
          description = ?, status = ?, updatedAt = NOW()
      WHERE suspectId = ?`;

    await db.execute(sql, [
      this.name,
      this.address,
      this.phoneNumber,
      this.description,
      this.status,
      this.suspectId
    ]);
  }

  static async create(suspectData) {
    const sql = `
      INSERT INTO suspects (
        name, address, phoneNumber, description, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
  
    const [result] = await db.execute(sql, [
      suspectData.name,
      suspectData.address,
      suspectData.phoneNumber,
      suspectData.description,
      suspectData.status
    ]);
  
    const insertedSuspect = await Suspect.findById(result.insertId);
  
    // 👇 Update caserecords table with the new suspectId and status
    if (suspectData.suspectId) {
      const updateSQL = `
        UPDATE caserecords 
        SET suspectId = ?, lastUpdated = NOW()
        WHERE recordId = ?`;
  
      await db.execute(updateSQL, [
        insertedSuspect.suspectId,
        suspectData.suspectId
      ]);
    }
  
    return insertedSuspect;
  }
  

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM suspects WHERE suspectId = ?', [id]);
    if (rows.length === 0) return null;
    return new Suspect(rows[0]);
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM suspects');
    return rows.map(row => new Suspect(row));
  }

  static async deleteById(id) {
    await db.execute('DELETE FROM suspects WHERE suspectId = ?', [id]);
  }
}

export default Suspect;