import db from '../database/db.js';

class Witness {
  constructor(witness) {
    this.witnessId = witness.witnessId;
    this.name = witness.name;
    this.address = witness.address;
    this.phoneNumber = witness.phoneNumber;
    this.statement = witness.statement;
    this.relationToCase = witness.relationToCase;
    this.createdAt = witness.createdAt;
    this.updatedAt = witness.updatedAt;
  }

  async save() {
    const sql = `
      UPDATE witnesses 
      SET name = ?, address = ?, phoneNumber = ?, 
          statement = ?, relationToCase = ?, updatedAt = NOW()
      WHERE witnessId = ?`;

    await db.execute(sql, [
      this.name,
      this.address,
      this.phoneNumber,
      this.statement,
      this.relationToCase,
      this.witnessId
    ]);
  }

  static async create(witnessData) {
    const sql = `
      INSERT INTO witnesses (
        name, address, phoneNumber, statement, 
        relationToCase, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
  
    const [result] = await db.execute(sql, [
      witnessData.name,
      witnessData.address,
      witnessData.phoneNumber,
      witnessData.statement,
      witnessData.relationToCase
    ]);
  
    const insertedWitness = await Witness.findById(result.insertId);
  
    // 👇 Update caserecords table with the new witnessId and status
    if (witnessData.witnessId) {
      const updateSQL = `
        UPDATE caserecords 
        SET witnessId = ?,  lastUpdated = NOW()
        WHERE recordId = ?`;
  
      await db.execute(updateSQL, [
        insertedWitness.witnessId,
        insertedWitness.witnessId
      ]);
    }
  
    return insertedWitness;
  }
  

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM witnesses WHERE witnessId = ?', [id]);
    if (rows.length === 0) return null;
    return new Witness(rows[0]);
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM witnesses');
    return rows.map(row => new Witness(row));
  }

  static async deleteById(id) {
    await db.execute('DELETE FROM witnesses WHERE witnessId = ?', [id]);
  }
}

export default Witness;