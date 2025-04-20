import db from '../database/db.js';

class Case {
  constructor(caseData) {
    this.caseId = caseData.caseId;
    this.incidentType = caseData.incidentType;
    this.dateTime = caseData.dateTime;
    this.location = caseData.location;
    this.status = caseData.status;
    this.priority = caseData.priority;
    this.description = caseData.description;
    this.assignedTo = caseData.assignedTo;
    this.createdAt = caseData.createdAt;
    this.updatedAt = caseData.updatedAt;
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM cases');
    return rows.map(row => new Case(row));
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM cases WHERE caseId = ?', [id]);
    if (rows.length === 0) return null;
    return new Case(rows[0]);
  }

  static async create(caseData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
  
      const insertCaseSql = `
        INSERT INTO cases (
          incidentType, dateTime, location, status, 
          priority, description, assignedTo, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
  
      const [caseResult] = await connection.execute(insertCaseSql, [
        caseData.incidentType,
        caseData.dateTime,
        caseData.location,
        caseData.status || 'pending',
        caseData.priority || 'low',
        caseData.description,
        caseData.assignedTo || null
      ]);
  
      const caseId = caseResult.insertId;
  
      // 👇 Now insert into caserecords table
      const insertRecordSql = `
        INSERT INTO caserecords (
          caseId, officerId, status, approvalStatus, 
          dateCreated, lastUpdated
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`;
  
      await connection.execute(insertRecordSql, [
        caseId,
        caseData.assignedTo || null,
        'active',
        'pending'
      ]);
  
      await connection.commit();
  
      return await Case.findById(caseId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
  

  async save() {
    const sql = `
      UPDATE cases 
      SET incidentType = ?, dateTime = ?, location = ?,
          status = ?, priority = ?, description = ?,
          assignedTo = ?, updatedAt = NOW()
      WHERE caseId = ?`;

    await db.execute(sql, [
      this.incidentType,
      this.dateTime,
      this.location,
      this.status,
      this.priority,
      this.description,
      this.assignedTo,
      this.caseId
    ]);
  }

  static async deleteById(id) {
    await db.execute('DELETE FROM cases WHERE caseId = ?', [id]);
  }
}

export default Case;