import db from '../database/db.js';

class Record {
  constructor(record) {
    // Match exact database column names
    this.recordId = record.recordId;
    this.caseId = record.caseId;
    this.victimId = record.victimId;
    this.officerId = record.officerId || null;
    this.suspectId = record.suspectId;
    this.createdBy = record.createdBy;
    this.status = record.status || 'pending';
    this.dateCreated = record.dateCreated;
    this.lastUpdated = record.lastUpdated;

    // Additional joined data if available
    this.caseName = record.caseName;
    this.victimName = record.victimName;
    this.officerName = record.officerName;
    this.suspectName = record.suspectName;
    this.creatorName = record.creatorName;

    // Add to constructor in Record class
    this.approvalStatus = record.approvalStatus || 'pending'; // pending, approved, rejected
    this.approvalDate = record.approvalDate;
    this.approvedBy = record.approvedBy;
    this.rejectionReason = record.rejectionReason;
  }

  async save() {
    const sql = `
      UPDATE caserecords 
      SET caseId = ?,
          victimId = ?,
          officerId = ?,
          suspectId = ?,
          status = ?,
          approvalStatus = ?,
          lastUpdated = NOW()
      WHERE recordId = ?`;

    return await db.execute(sql, [
      this.caseId,
      this.victimId,
      this.officerId,
      this.suspectId,
      this.status,
      this.approvalStatus,
      this.recordId
    ]);
  }

  static async create(recordData) {
    const sql = `
      INSERT INTO caserecords 
      (caseId, victimId, officerId, suspectId, createdBy, status, approvalStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.execute(sql, [
      recordData.caseId,
      recordData.victimId || null,
      recordData.officerId,
      recordData.suspectId || null,
      recordData.createdBy,
      recordData.status || 'pending',
      recordData.approvalStatus || 'pending'
    ]);

    return await Record.findById(result.insertId);
  }

  static async findById(id) {
    const sql = `
      SELECT r.*,
             c.incidentType AS caseName,
             v.name AS victimName,
             o.name AS officerName,
             s.name AS suspectName,
             u.name AS creatorName
      FROM caserecords r
      LEFT JOIN cases c ON r.caseId = c.caseId
      LEFT JOIN victims v ON r.victimId = v.victimId
      LEFT JOIN officers o ON r.officerId = o.officerId
      LEFT JOIN suspects s ON r.suspectId = s.suspectId
      LEFT JOIN users u ON r.createdBy = u.id
      WHERE r.recordId = ?`;

    const [rows] = await db.execute(sql, [id]);
    return rows.length ? new Record(rows[0]) : null;
  }

  static async findAll() {
    const sql = `
      SELECT r.*,
             c.incidentType AS caseName,
             v.name AS victimName,
             o.name AS officerName,
             s.name AS suspectName,
             u.name AS creatorName
      FROM caserecords r
      LEFT JOIN cases c ON r.caseId = c.caseId
      LEFT JOIN victims v ON r.victimId = v.victimId
      LEFT JOIN officers o ON r.officerId = o.officerId
      LEFT JOIN suspects s ON r.suspectId = s.suspectId
      LEFT JOIN users u ON r.createdBy = u.id
      ORDER BY r.dateCreated DESC`;

    const [rows] = await db.execute(sql);
    return rows.map(row => new Record(row));
  }

  static async deleteById(id) {
    const sql = `DELETE FROM caserecords WHERE recordId = ?`;
    return await db.execute(sql, [id]);
  }
}

export default Record;