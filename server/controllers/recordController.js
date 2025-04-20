import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import db from "../database/db.js";
import Record from "../models/recordmodel.js";
import Case from "../models/casemodel.js";
import Victim from "../models/victimmodel.js";
import Suspect from "../models/suspectmodel.js";
import Evidence from "../models/evidencemodel.js";

//insert manually 
export const insertRecordManually = catchAsyncErrors(async (req, res, next) => {
  const {
    caseId,
    victimId,
    suspectId,
    evidenceId,
    createdBy // officerId removed
  } = req.body;

  // Validation (officerId removed from required fields)
  if (!caseId || !createdBy) {
    return next(new ErrorHandler("caseId and createdBy are required", 400));
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if all IDs exist in their respective tables
    const [[caseExists]] = await connection.execute('SELECT * FROM cases WHERE caseId = ?', [caseId]);
    if (!caseExists) return next(new ErrorHandler("Case not found", 404));

    if (victimId) {
      const [[victimExists]] = await connection.execute('SELECT * FROM victims WHERE victimId = ?', [victimId]);
      if (!victimExists) return next(new ErrorHandler("Victim not found", 404));
    }

    if (suspectId) {
      const [[suspectExists]] = await connection.execute('SELECT * FROM suspects WHERE suspectId = ?', [suspectId]);
      if (!suspectExists) return next(new ErrorHandler("Suspect not found", 404));
    }

    if (evidenceId) {
      const [[evidenceExists]] = await connection.execute('SELECT * FROM evidence WHERE evidenceId = ?', [evidenceId]);
      if (!evidenceExists) return next(new ErrorHandler("Evidence not found", 404));
    }

    const [[userExists]] = await connection.execute('SELECT * FROM users WHERE id = ?', [createdBy]);
    if (!userExists) return next(new ErrorHandler("CreatedBy user not found", 404));

    // Insert into caserecords (officerId set as NULL)
    const insertQuery = `
      INSERT INTO caserecords (
        caseId,
        victimId,
        suspectId,
        evidenceId,
        officerId,
        createdBy,
        status,
        approvalStatus,
        approvalDate,
        approvedBy,
        rejectionReason,
        dateCreated,
        lastUpdated
      ) VALUES (?, ?, ?, ?, NULL, ?, 'active', 'pending', NULL, NULL, NULL, NOW(), NOW())
    `;

    const [result] = await connection.execute(insertQuery, [
      caseId,
      victimId || null,
      suspectId || null,
      evidenceId || null,
      createdBy
    ]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Record inserted manually into caserecords table with officerId set as NULL",
      recordId: result.insertId
    });

  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
});


// Create complete record
export const createCompleteRecord = catchAsyncErrors(async (req, res, next) => {
  const {
    caseDetails,
    victimDetails,
    suspectDetails,
    evidenceDetails,
    officerId
  } = req.body;

  // Validation
  if (!caseDetails || !officerId) {
    return next(new ErrorHandler("Case details and officer ID are required", 400));
  }

  if (!caseDetails.incidentType || !caseDetails.dateTime || !caseDetails.location) {
    return next(new ErrorHandler("Incomplete case details", 400));
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Create case
    const case_ = await Case.create({
      ...caseDetails,
      status: 'open',
      assignedTo: officerId
    }, connection);

    // Create victim if provided
    let victim = null;
    if (victimDetails) {
      victim = await Victim.create(victimDetails, connection);
    }

    // Create suspect if provided
    let suspect = null;
    if (suspectDetails) {
      suspect = await Suspect.create(suspectDetails, connection);
    }

    // Create evidence if provided
    let evidence = null;
    if (evidenceDetails) {
      evidence = await Evidence.create({
        ...evidenceDetails,
        collectedBy: officerId
      }, connection);
    }

    // Create main record
    const record = await Record.create({
      caseId: case_.caseId,
      victimId: victim?.victimId,
      suspectId: suspect?.suspectId,
      officerId: null,
      createdBy: req.user.id,
      status: 'active',
      approvalStatus: 'pending'
    }, connection);

    await connection.commit();

    res.status(201).json({
      success: true,
      record,
      case: case_,
      victim,
      suspect,
      evidence
    });

  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

// Get all records with filtering
export const getAllRecords = catchAsyncErrors(async (req, res) => {
  const { page = 1, limit = 10, status, approvalStatus, fromDate, toDate } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT r.*, 
           c.incidentType,
           v.name as victimName,
           s.name as suspectName,
           u.name as createdByName
    FROM caserecords r
    LEFT JOIN cases c ON r.caseId = c.caseId
    LEFT JOIN victims v ON r.victimId = v.victimId
    LEFT JOIN suspects s ON r.suspectId = s.suspectId
    LEFT JOIN users u ON r.createdBy = u.id
    WHERE 1=1`;

  const params = [];

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  if (approvalStatus) {
    query += ' AND r.approvalStatus = ?';
    params.push(approvalStatus);
  }

  if (fromDate) {
    query += ' AND r.dateCreated >= ?';
    params.push(fromDate);
  }

  if (toDate) {
    query += ' AND r.dateCreated <= ?';
    params.push(toDate);
  }

  query += ' ORDER BY r.dateCreated DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [records] = await db.execute(query, params);
  const [countResult] = await db.execute('SELECT COUNT(*) as total FROM caserecords WHERE 1=1');

  res.status(200).json({
    success: true,
    records,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(countResult[0].total / limit),
      totalRecords: countResult[0].total,
      limit: Number(limit)
    }
  });
});

// Get pending records
export const getPendingRecords = catchAsyncErrors(async (req, res) => {
  const query = `
    SELECT r.*, 
           c.incidentType,
           v.name as victimName,
           s.name as suspectName,
           u.name as createdByName
    FROM caserecords r
    LEFT JOIN cases c ON r.caseId = c.caseId
    LEFT JOIN victims v ON r.victimId = v.victimId
    LEFT JOIN suspects s ON r.suspectId = s.suspectId
    LEFT JOIN users u ON r.createdBy = u.id
    WHERE r.approvalStatus = 'pending'
    ORDER BY r.dateCreated DESC`;

  const [records] = await db.execute(query);

  res.status(200).json({
    success: true,
    records
  });
});

// Approve record
export const approveRecord = catchAsyncErrors(async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const record = await Record.findById(req.params.id, connection);
    
    if (!record) {
      return next(new ErrorHandler("Record not found", 404));
    }

    if (record.approvalStatus !== 'pending') {
      return next(new ErrorHandler("Record is already processed", 400));
    }

    const updateQuery = `
      UPDATE caserecords 
      SET approvalStatus = 'approved',
          approvalDate = NOW(),
          approvedBy = ?,
          lastUpdated = NOW()
      WHERE recordId = ?`;

    await connection.execute(updateQuery, [req.user.id, record.recordId]);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Record approved successfully"
    });

  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

// Reject record
export const rejectRecord = catchAsyncErrors(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new ErrorHandler("Rejection reason is required", 400));
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const record = await Record.findById(req.params.id, connection);
    
    if (!record) {
      return next(new ErrorHandler("Record not found", 404));
    }

    if (record.approvalStatus !== 'pending') {
      return next(new ErrorHandler("Record is already processed", 400));
    }

    const updateQuery = `
      UPDATE caserecords 
      SET approvalStatus = 'rejected',
          approvalDate = NOW(),
          approvedBy = ?,
          rejectionReason = ?,
          lastUpdated = NOW()
      WHERE recordId = ?`;

    await connection.execute(updateQuery, [req.user.id, reason, record.recordId]);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Record rejected successfully"
    });

  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

// Get record statistics
export const getRecordStats = catchAsyncErrors(async (req, res) => {
  const [stats] = await db.execute(`
    SELECT 
      COUNT(*) as totalRecords,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as activeRecords,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closedRecords,
      COUNT(CASE WHEN approvalStatus = 'pending' THEN 1 END) as pendingApprovals,
      COUNT(CASE WHEN approvalStatus = 'approved' THEN 1 END) as approvedRecords,
      COUNT(CASE WHEN approvalStatus = 'rejected' THEN 1 END) as rejectedRecords,
      COUNT(DISTINCT suspectId) as totalSuspects,
      COUNT(DISTINCT victimId) as totalVictims
    FROM caserecords
  `);

  res.status(200).json({
    success: true,
    statistics: stats[0]
  });
});

// Get single record
export const getRecord = catchAsyncErrors(async (req, res, next) => {
  const record = await Record.findById(req.params.id);
  if (!record) {
    return next(new ErrorHandler("Record not found", 404));
  }
  res.status(200).json({ success: true, record });
});

// Update record
export const updateRecord = catchAsyncErrors(async (req, res, next) => {
  let record = await Record.findById(req.params.id);
  if (!record) {
    return next(new ErrorHandler("Record not found", 404));
  }
  Object.assign(record, req.body);
  await record.save();
  res.status(200).json({ success: true, record });
});

// Delete record
export const deleteRecord = catchAsyncErrors(async (req, res, next) => {
  const record = await Record.findById(req.params.id);
  if (!record) {
    return next(new ErrorHandler("Record not found", 404));
  }
  await Record.deleteById(req.params.id);
  res.status(200).json({ success: true, message: "Record deleted successfully" });
});

// Update the export default to include the new functions
export default {
  createCompleteRecord,
  getAllRecords,
  getRecord,           // Add this
  updateRecord,        // Add this
  deleteRecord,        // Add this
  getPendingRecords,
  approveRecord,
  rejectRecord,
  getRecordStats
};