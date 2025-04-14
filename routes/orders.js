const express = require('express');
const router = express.Router();
const db = require('../config/database'); 


// Utility function to generate a random ID (for order_id or shipping_id)
const generateRandomId = () => Math.floor(Math.random() * 1000000000);



router.get('/vendor/:vendor_id', async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const query = `
      SELECT o.*
      FROM orders AS o
      JOIN item AS i ON o.item_id = i.item_id
      WHERE i.vendor_id = ?
    `;
    const [orders] = await db.query(query, [vendor_id]);
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for the specified vendor" });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




router.put('/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { order_status, payment_status, shipping_address, shipping_id, item_id, item_quantity, item_price } = req.body;

  try {
    const [existingOrder] = await db.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    if (!existingOrder || existingOrder.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updatedShippingAddress = (shipping_address && typeof shipping_address === 'object')
      ? JSON.stringify(shipping_address)
      : shipping_address;
    
    const updatedOrderStatus = order_status || existingOrder[0].order_status;
    const updatedPaymentStatus = payment_status || existingOrder[0].payment_status;
    const updatedShippingId = shipping_id || existingOrder[0].shipping_id;
    const updatedItemId = item_id || existingOrder[0].item_id;
    const updatedItemQuantity = item_quantity || existingOrder[0].item_quantity;
    const updatedItemPrice = item_price || existingOrder[0].item_price;
    const finalShippingAddress = updatedShippingAddress || existingOrder[0].shipping_address;
    
    await db.query(
      `UPDATE orders 
       SET order_status = ?, payment_status = ?, shipping_address = ?, shipping_id = ?, item_id = ?, item_quantity = ?, item_price = ?
       WHERE order_id = ?`,
      [updatedOrderStatus, updatedPaymentStatus, finalShippingAddress, updatedShippingId, updatedItemId, updatedItemQuantity, updatedItemPrice, order_id]
    );
    
    res.json({ 
      message: "Order updated successfully.",
      order_id,
      order_status: updatedOrderStatus,
      payment_status: updatedPaymentStatus,
      shipping_address: finalShippingAddress,
      shipping_id: updatedShippingId,
      item_id: updatedItemId,
      item_quantity: updatedItemQuantity,
      item_price: updatedItemPrice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/shipping', async (req, res) => {
  const { order_id, shipping_method, shipping_cost, shipping_date, tracking_number, delivery_date, shipping_status } = req.body;
  
  if (!order_id || !shipping_method) {
    return res.status(400).json({ message: "order_id and shipping_method are required" });
  }
  
  const shipping_id = generateRandomId();

  try {
    await db.query(
      `INSERT INTO shipping 
        (shipping_id, order_id, shipping_method, shipping_cost, shipping_date, tracking_number, delivery_date, shipping_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [shipping_id, order_id, shipping_method, shipping_cost, shipping_date, tracking_number, delivery_date, shipping_status]
    );

    res.status(201).json({
      shipping_id,
      order_id,
      shipping_method,
      shipping_cost,
      shipping_date,
      tracking_number,
      delivery_date,
      shipping_status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




router.post('/cancel', async (req, res) => {
  const { return_reason, order_id } = req.body;

  // Validate required fields.
  if (!return_reason || !order_id) {
    return res.status(400).json({ message: "return_reason and order_id are required." });
  }

  // Generate IDs.
  const return_id = generateRandomId();
  const refund_id = generateRandomId();
  const request_date = new Date().toISOString();

  try {
    // Step 1: Update order_status to 'approve_cancel'
    const [updateResult] = await db.query(
      `UPDATE orders SET order_status = ? WHERE order_id = ?`,
      ['approve_cancel', order_id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found or could not update order_status." });
    }

    // Step 2: Insert into returnrequest table
    await db.query(
      `INSERT INTO returnrequest (return_id, order_id, return_reason, status, request_date)
       VALUES (?, ?, ?, ?, ?)`,
      [return_id, order_id, return_reason, '', request_date]
    );

    // Send success response
    res.status(201).json({
      message: "Order cancellation initiated successfully.",
      returnrequest: {
        return_id,
        order_id,
        return_reason,
        status: '',
        request_date
      }
    });
  } catch (error) {
    console.error("Database error during cancellation:", error);
    res.status(500).json({ error: error.message });
  }
});



router.put('/admin/approve', async (req, res) => {
  const { order_id, return_id, status, refund_amount, payment_method, comment } = req.body;

  // Validate required fields.
  if (!order_id || !return_id || !status || refund_amount === undefined || comment === undefined) {
    return res.status(400).json({
      message: "order_id, return_id, status, refund_amount, and comment are required."
    });
  }

  // For approved status, payment_method is required.
  if (status.toLowerCase() === "approved" && !payment_method) {
    return res.status(400).json({
      message: "payment_method is required when status is approved."
    });
  }

  // Use the current date for refund_date (ISO format).
  const refund_date = new Date().toISOString();

  try {
    // Query the returnrequest table to verify that both the provided return_id
    // and order_id are matching in the same row.
    const [returnRecords] = await db.query(
      `SELECT status FROM returnrequest WHERE return_id = ? AND order_id = ?`,
      [return_id, order_id]
    );

    // If no record exists, return a 404 error.
    if (!returnRecords || returnRecords.length === 0) {
      return res.status(404).json({ message: "Return request not found for the given order_id and return_id." });
    }

    // Check if the return request is already approved.
    const existingStatus = returnRecords[0].status;
    if (existingStatus && existingStatus.toLowerCase() === "approved") {
      return res.status(400).json({ message: "Return request is already approved." });
    }

    // Update the returnrequest table with the new status.
    await db.query(
      `UPDATE returnrequest 
       SET status = ?
       WHERE return_id = ? AND order_id = ?`,
      [status, return_id, order_id]
    );

    // Update the refund table: update if a record exists with the given order_id,
    // and set the comment provided by the admin.
    const [refundResult] = await db.query(
      `UPDATE refund 
       SET refund_amount = ?, refund_date = ?, status = ?, comment = ?
       WHERE order_id = ?`,
      [refund_amount, refund_date, status, comment, order_id]
    );

    // If no record was updated, insert a new refund record.
    if (refundResult.affectedRows === 0) {
      const refund_id = generateRandomId();
      await db.query(
        `INSERT INTO refund (refund_id, order_id, refund_amount, refund_date, status, comment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [refund_id, order_id, refund_amount, refund_date, status, comment]
      );
    }

    // If the status is approved, insert a record into the payment table.
    if (status.toLowerCase() === "approved") {
      const payment_date = new Date().toISOString();
      const payment_id = generateRandomId();
      await db.query(
        `INSERT INTO payment (payment_id, order_id, payment_amount, payment_date, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [payment_id, order_id, refund_amount, payment_date, payment_method, status]
      );
    }

    res.json({
      message: "Approval processed successfully.",
      order_id,
      return_id,
      status,
      refund_amount,
      refund_date,
      comment,
      payment_method: status.toLowerCase() === "approved" ? payment_method : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
