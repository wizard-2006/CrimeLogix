import db from '../database/db.js';

class Victim {
  constructor(victim) {
    this.victimId = victim.victimId;
    this.name = victim.name;
    this.address = victim.address;
    this.phoneNumber = victim.phoneNumber;
    this.email = victim.email;
    this.dateOfBirth = victim.dateOfBirth;
    this.createdAt = victim.createdAt;
    this.updatedAt = victim.updatedAt;
  }

  // Save changes for an existing victim
  async save() {
    const sql = `
      UPDATE victims 
      SET name = ?, address = ?, phoneNumber = ?, 
          email = ?, dateOfBirth = ?, updatedAt = NOW()
      WHERE victimId = ?`;

    await db.execute(sql, [
      this.name,
      this.address,
      this.phoneNumber,
      this.email,
      this.dateOfBirth,
      this.victimId
    ]);
  }

  // Create a new victim
  static async create(victimData) {
    const sql = `
      INSERT INTO victims (
        name, address, phoneNumber, email, dateOfBirth, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
  
    const [result] = await db.execute(sql, [
      victimData.name,
      victimData.address,
      victimData.phoneNumber,
      victimData.email,
      victimData.dateOfBirth
    ]);
  
    const insertedVictim = await Victim.findById(result.insertId);
  
    // 👇 Update caserecords table with the new victimId and status
    if (victimData.victimId) {
      const updateSQL = `
        UPDATE caserecords 
        SET victimId = ?, lastUpdated = NOW()
        WHERE recordId = ?`;
  
      await db.execute(updateSQL, [
        insertedVictim.victimId,
        victimData.victimId
      ]);
    }
  
    return insertedVictim;
  }
  

  // Find victim by ID
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM victims WHERE victimId = ?', [id]);
    if (rows.length === 0) return null;
    return new Victim(rows[0]);
  }

  // Get all victims
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM victims');
    return rows.map(row => new Victim(row));
  }

  // Delete a victim
  static async deleteById(id) {
    await db.execute('DELETE FROM victims WHERE victimId = ?', [id]);
  }
}

export default Victim;