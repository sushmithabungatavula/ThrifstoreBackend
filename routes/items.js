const express = require('express');
const router = express.Router();
const db = require('../config/database'); 

// Update an existing item by item_id
router.put('/updateitem/:item_id', async (req, res) => {
  const { item_id } = req.params;
  // Include categoryId along with other fields
  const { vendor_id, categoryId, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description } = req.body;

  try {
    // Check if the item exists
    const [existingItem] = await db.query('SELECT * FROM item WHERE item_id = ?', [item_id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update the item including categoryId
    const [result] = await db.query(
      `UPDATE item 
       SET vendor_id = ?, categoryId = ?, name = ?, brand = ?, size = ?, color = ?, item_condition = ?, cost_price = ?, selling_price = ?, stock_quantity = ?, imageURL = ?, description = ? 
       WHERE item_id = ?`,
      [vendor_id, categoryId, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description, item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found or no changes made' });
    }

    res.json({
      item_id,
      vendor_id,
      categoryId,
      name,
      brand,
      size,
      color,
      item_condition,
      cost_price,
      selling_price,
      stock_quantity,
      imageURL,
      description,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Fetch all items from the 'item' table
router.get('/items', async (req, res) => {
  try {
    // SQL query to fetch all items from the 'item' table
    const [items] = await db.query(`
      SELECT item_id, categoryId, vendor_id, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description, reviews
      FROM item
    `);

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found' });
    }

    // Return the list of items
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message });
  }
});




// Delete an item by item_id
router.delete('/deleteitem/:item_id', async (req, res) => {
  const { item_id } = req.params;

  try {
    // Check if the item exists
    const [existingItem] = await db.query('SELECT * FROM item WHERE item_id = ?', [item_id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Delete the item from the 'item' table
    const [result] = await db.query('DELETE FROM item WHERE item_id = ?', [item_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found or already deleted' });
    }

    // Return success message
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update stock (add or remove) and update the selling price if provided.
router.put('/updateStock/:item_id', async (req, res) => {
  const { item_id } = req.params;
  const { operation, quantity, newSellingPrice } = req.body; // newSellingPrice is only needed for "add"

  try {
    // Get the current item record
    const [rows] = await db.query('SELECT * FROM item WHERE item_id = ?', [item_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const item = rows[0];
    const currentStock = parseFloat(item.stock_quantity) || 0;
    const currentSellingPrice = parseFloat(item.selling_price) || 0;

    let updatedStock = currentStock;
    let updatedSellingPrice = currentSellingPrice;

    if (operation === 'add') {
      // Validate quantity (must be greater than 0)
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity provided for addition' });
      }
      updatedStock = currentStock + quantity;
      // When adding stock, we update selling price from the frontend calculation.
      // (If newSellingPrice is provided and valid, then update it.)
      if (typeof newSellingPrice === 'number' && newSellingPrice > 0) {
        updatedSellingPrice = newSellingPrice;
      }
    } else if (operation === 'remove') {
      // Validate removal quantity
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity provided for removal' });
      }
      if (quantity > currentStock) {
        return res.status(400).json({ message: 'Insufficient stock available for removal' });
      }
      updatedStock = currentStock - quantity;
      // For removals, selling price remains unchanged.
    } else {
      return res.status(400).json({ message: "Invalid operation. Must be 'add' or 'remove'" });
    }

    // Update the stock and selling price in the database
    await db.query(
      'UPDATE item SET stock_quantity = ?, selling_price = ? WHERE item_id = ?',
      [updatedStock, updatedSellingPrice, item_id]
    );

    res.json({
      item_id,
      updatedStock,
      updatedSellingPrice
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: error.message });
  }
});




// Upload (Create) a new item
router.post('/additem', async (req, res) => {
  // Destructure categoryId along with other item properties
  const { vendor_id, categoryId, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description } = req.body;

  try {
    // Insert a new item including categoryId into the 'item' table
    const [result] = await db.query(
      `INSERT INTO item (vendor_id, categoryId, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vendor_id, categoryId, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description]
    );

    res.status(201).json({
      item_id: result.insertId,
      vendor_id,
      categoryId,
      name,
      brand,
      size,
      color,
      item_condition,
      cost_price,
      selling_price,
      stock_quantity,
      imageURL,
      description,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Fetch a specific item by item_id
router.get('/:item_id', async (req, res) => {
  const { item_id } = req.params;

  try {
    // SQL query to fetch the item by item_id
    const [item] = await db.query('SELECT item_id,categoryId, vendor_id, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description, reviews FROM item WHERE item_id = ?', [item_id]);

    if (item.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Return the details of the found item
    res.json(item[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;