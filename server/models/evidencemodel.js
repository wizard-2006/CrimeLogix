import db from '../database/db.js';

class Evidence {
  constructor(evidence) {
    this.evidenceId = evidence.evidenceId;
    this.substances = evidence.substances;
    this.description = evidence.description;
    this.location = evidence.location;
    this.dateTime = evidence.dateTime;
    this.collectedBy = evidence.collectedBy;
    this.storageLocation = evidence.storageLocation;
    this.status = evidence.status;
    this.createdAt = evidence.createdAt;
    this.updatedAt = evidence.updatedAt;
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM evidence');
    return rows.map(row => new Evidence(row));
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM evidence WHERE evidenceId = ?', [id]);
    if (rows.length === 0) return null;
    return new Evidence(rows[0]);
  }

  static async create(evidenceData) {
    const sql = `
      INSERT INTO evidence (
        substances, description, location, dateTime, 
        collectedBy, storageLocation, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
  
    const [result] = await db.execute(sql, [
      evidenceData.substances,
      evidenceData.description,
      evidenceData.location,
      evidenceData.dateTime,
      evidenceData.collectedBy,
      evidenceData.storageLocation,
      evidenceData.status
    ]);
  
    const insertedEvidence = await Evidence.findById(result.insertId);
  
    // 👇 Update caserecords table with the new evidenceId and status
    if (evidenceData.evidenceId) {
      const updateSQL = `
        UPDATE caserecords 
        SET evidenceId = ?, lastUpdated = NOW()
        WHERE recordId = ?`;
  
      await db.execute(updateSQL, [
        insertedEvidence.evidenceId,
        evidenceData.evidenceId
      ]);
    }
  
    return insertedEvidence;
  }
  

  async save() {
    const sql = `
      UPDATE evidence 
      SET substances = ?, description = ?, location = ?,
          dateTime = ?, collectedBy = ?, storageLocation = ?,
          status = ?, updatedAt = NOW()
      WHERE evidenceId = ?`;

    await db.execute(sql, [
      this.substances,
      this.description,
      this.location,
      this.dateTime,
      this.collectedBy,
      this.storageLocation,
      this.status,
      this.evidenceId
    ]);
  }

  static async deleteById(id) {
    await db.execute('DELETE FROM evidence WHERE evidenceId = ?', [id]);
  }
}

export default Evidence;