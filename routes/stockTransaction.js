const express = require('express');
const router = express.Router();
const db = require('../config/database');

// CREATE a new stock transaction
router.post('/create', async (req, res) => {
  // Destructure expected values from the request body
  const {
    transaction_type,
    item_id,
    vendor_id,
    performed_by,
    quantity,
    unit_price,
    total_cost,
    batch_number,
    allocated_transport,
    allocated_other,
    allocated_tax,
    notes
  } = req.body;

  // Ensure required fields are present (you might add more validations here)
  if (!transaction_type || !item_id || !performed_by || !quantity) {
    return res.status(400).json({ message: 'Required fields missing (transaction_type, item_id, performed_by, quantity)' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO stockTransactions 
      (transaction_type, item_id, vendor_id, performed_by, quantity, unit_price, total_cost, batch_number, allocated_transport, allocated_other, allocated_tax, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction_type,
        item_id,
        vendor_id || null,
        performed_by,
        quantity,
        unit_price || 0,
        total_cost || 0,
        batch_number || null,
        allocated_transport || 0,
        allocated_other || 0,
        allocated_tax || 0,
        notes || null
      ]
    );

    res.status(201).json({
      transaction_id: result.insertId,
      transaction_type,
      item_id,
      vendor_id,
      performed_by,
      quantity,
      unit_price: unit_price || 0,
      total_cost: total_cost || 0,
      batch_number: batch_number || null,
      allocated_transport: allocated_transport || 0,
      allocated_other: allocated_other || 0,
      allocated_tax: allocated_tax || 0,
      notes: notes || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE an existing stock transaction
router.put('/update/:transaction_id', async (req, res) => {
  const { transaction_id } = req.params;
  const {
    transaction_type,
    item_id,
    vendor_id,
    performed_by,
    quantity,
    unit_price,
    total_cost,
    batch_number,
    allocated_transport,
    allocated_other,
    allocated_tax,
    notes
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE stockTransactions 
       SET 
         transaction_type = COALESCE(?, transaction_type),
         item_id = COALESCE(?, item_id),
         vendor_id = COALESCE(?, vendor_id),
         performed_by = COALESCE(?, performed_by),
         quantity = COALESCE(?, quantity),
         unit_price = COALESCE(?, unit_price),
         total_cost = COALESCE(?, total_cost),
         batch_number = COALESCE(?, batch_number),
         allocated_transport = COALESCE(?, allocated_transport),
         allocated_other = COALESCE(?, allocated_other),
         allocated_tax = COALESCE(?, allocated_tax),
         notes = COALESCE(?, notes)
       WHERE transaction_id = ?`,
      [
        transaction_type,
        item_id,
        vendor_id,
        performed_by,
        quantity,
        unit_price,
        total_cost,
        batch_number,
        allocated_transport,
        allocated_other,
        allocated_tax,
        notes,
        transaction_id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction not found or no changes made' });
    }
    
    res.json({
      transaction_id,
      transaction_type,
      item_id,
      vendor_id,
      performed_by,
      quantity,
      unit_price,
      total_cost,
      batch_number,
      allocated_transport,
      allocated_other,
      allocated_tax,
      notes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a stock transaction
router.delete('/delete/:transaction_id', async (req, res) => {
  const { transaction_id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM stockTransactions WHERE transaction_id = ?', [transaction_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// GET stock transactions by vendor_id
router.get('/vendor/:vendor_id', async (req, res) => {
    const { vendor_id } = req.params;
    try {
      const [transactions] = await db.query(
        'SELECT * FROM stockTransactions WHERE vendor_id = ? ORDER BY created_at DESC',
        [vendor_id]
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET stock transactions by transaction_type
  router.get('/type/:transaction_type', async (req, res) => {
    const { transaction_type } = req.params;
    const allowedTypes = ['stockIn', 'stockOut', 'adjustment'];
    if (!allowedTypes.includes(transaction_type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }
    try {
      const [transactions] = await db.query(
        'SELECT * FROM stockTransactions WHERE transaction_type = ? ORDER BY created_at DESC',
        [transaction_type]
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  

module.exports = router;
