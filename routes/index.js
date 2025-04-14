const express = require('express');
const router = express.Router();
const db = require('../config/database');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { v4: uuidv4 } = require('uuid'); 


// Fetch a specific address by addressId
router.get('/address/:addressId', async (req, res) => {
  const { addressId } = req.params;

  try {
    // Query to fetch the address by addressId
    const [address] = await db.query('SELECT * FROM savedaddress WHERE addressId = ?', [addressId]);

    if (address.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Return the address details
    res.json(address[0]);  // Only returning the first result since addressId is unique
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Fetch all saved addresses for a specific user (if needed)
router.get('/addresses', async (req, res) => {
  try {
    // Query to fetch all addresses
    const [addresses] = await db.query('SELECT * FROM savedaddress');

    if (addresses.length === 0) {
      return res.status(404).json({ message: 'No addresses found' });
    }

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





router.post('/address/:addressId', async (req, res) => {
  const { addressId } = req.params; 
  const { name, addressLine1, addressLine2, pincode, region, state, country, addressType, latitude, longitude } = req.body;

  try {
    // Insert a new address into the 'savedaddress' table with the provided addressId
    const [result] = await db.query(
      'INSERT INTO savedaddress (addressId, name, addressLine1, addressLine2, pincode, region, state, country, addressType, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [addressId, name, addressLine1, addressLine2, pincode, region, state, country, addressType, latitude, longitude]
    );

    res.status(201).json({
      addressId,
      name,
      addressLine1,
      addressLine2,
      pincode,
      region,
      state,
      country,
      addressType,
      latitude,
      longitude
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Update a specific address by addressId
router.put('/address/:addressId', async (req, res) => {
  const { addressId } = req.params;
  const { name, addressLine1, addressLine2, pincode, region, state, country, addressType, latitude, longitude } = req.body;

  try {
    // Check if the address exists
    const [existingAddress] = await db.query('SELECT * FROM savedaddress WHERE addressId = ?', [addressId]);
    if (existingAddress.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update the address in the 'savedaddress' table
    const [result] = await db.query(
      'UPDATE savedaddress SET name = ?, addressLine1 = ?, addressLine2 = ?, pincode = ?, region = ?, state = ?, country = ?, addressType = ?, latitude = ?, longitude = ? WHERE addressId = ?',
      [name, addressLine1, addressLine2, pincode, region, state, country, addressType, latitude, longitude, addressId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found or no changes made' });
    }

    // Return the updated address details
    res.json({
      addressId,
      name,
      addressLine1,
      addressLine2,
      pincode,
      region,
      state,
      country,
      addressType,
      latitude,
      longitude
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific address by addressId
router.delete('/address/:addressId', async (req, res) => {
  const { addressId } = req.params;

  try {
    // Check if the address exists
    const [existingAddress] = await db.query('SELECT * FROM savedaddress WHERE addressId = ?', [addressId]);
    if (existingAddress.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Delete the address from the 'savedaddress' table
    const [result] = await db.query('DELETE FROM savedaddress WHERE addressId = ?', [addressId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found or already deleted' });
    }

    // Return success message
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





// // Add item to cart
// router.post('/cart/:customer_id/add', async (req, res) => {
//   const { customer_id } = req.params;
//   const { item_id, quantity } = req.body;

//   if (!item_id || !quantity) {
//     return res.status(400).json({ message: 'item_id and quantity are required' });
//   }

//   try {
//     // Insert or update the item in the cart_items table
//     const [existingItem] = await db.query('SELECT * FROM cart_items WHERE customer_id = ? AND item_id = ?', [customer_id, item_id]);

//     if (existingItem.length > 0) {
//       // Update quantity if item exists
//       await db.query('UPDATE cart_items SET quantity = ? WHERE customer_id = ? AND item_id = ?', [existingItem[0].quantity + quantity, customer_id, item_id]);
//     } else {
//       // Insert new item to cart
//       await db.query('INSERT INTO cart_items (customer_id, item_id, quantity) VALUES (?, ?, ?)', [customer_id, item_id, quantity]);
//     }

//     res.status(200).json({ message: 'Item added to cart' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Remove item from cart
// router.delete('/cart/:customer_id/remove', async (req, res) => {
//   const { customer_id } = req.params;
//   const { item_id } = req.body;

//   if (!item_id) {
//     return res.status(400).json({ message: 'item_id is required' });
//   }

//   try {
//     const [existingItem] = await db.query('SELECT * FROM cart_items WHERE customer_id = ? AND item_id = ?', [customer_id, item_id]);

//     if (existingItem.length === 0) {
//       return res.status(404).json({ message: 'Item not found in cart' });
//     }

//     await db.query('DELETE FROM cart_items WHERE customer_id = ? AND item_id = ?', [customer_id, item_id]);

//     res.status(200).json({ message: 'Item removed from cart' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });



// Get items in a wishlist
router.get('/wishlist/:wishlist_id', async (req, res) => {
  const { wishlist_id } = req.params;

  try {
    // Query the database to get all items in the wishlist
    const [items] = await db.query('SELECT * FROM wishlist WHERE wishlist_id = ?', [wishlist_id]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'Wishlist is empty or not found' });
    }

    // Send the list of items as a response
    res.status(200).json({ wishlist_id, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Add item to wishlist
router.post('/wishlist/:wishlist_id/add', async (req, res) => {
  const { wishlist_id } = req.params;
  const { item_id } = req.body;

  if (!item_id) {
    return res.status(400).json({ message: 'item_id is required' });
  }

  try {
    // Check if the item is already in the wishlist
    const [existingItem] = await db.query('SELECT * FROM wishlist WHERE wishlist_id = ? AND item_id = ?', [wishlist_id, item_id]);

    if (existingItem.length > 0) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    // Insert new item to wishlist
    await db.query('INSERT INTO wishlist (wishlist_id, item_id) VALUES (?, ?)', [wishlist_id, item_id]);

    res.status(200).json({ message: 'Item added to wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove item from wishlist
router.delete('/wishlist/:wishlist_id/remove', async (req, res) => {
  const { wishlist_id } = req.params;
  const { item_id } = req.body;

  if (!item_id) {
    return res.status(400).json({ message: 'item_id is required' });
  }

  try {
    const [existingItem] = await db.query('SELECT * FROM wishlist WHERE wishlist_id = ? AND item_id = ?', [wishlist_id, item_id]);

    if (existingItem.length === 0) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    await db.query('DELETE FROM wishlist WHERE wishlist_id = ? AND item_id = ?', [wishlist_id, item_id]);

    res.status(200).json({ message: 'Item removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Fetch cart details by cart_id (item_id and quantity)
router.get('/cart/:cart_id/items', async (req, res) => {
  const { cart_id } = req.params;

  try {
    // Query to fetch item_id and quantity for the specific cart_id
    const [items] = await db.query(`
      SELECT item_id, quantity
      FROM cart_items
      WHERE cart_id = ?
    `, [cart_id]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found for this cart' });
    }

    // Return the array of item_id and quantity pairs
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

  // Fetch wishlist details by customer_id (wishlist_id, customer_id, item_id)
router.get('/wishlist/:wishlist_id/items', async (req, res) => {
  const { wishlist_id } = req.params;

  try {
    // Query to fetch wishlist_id, customer_id, and item_id for the specific customer_id
    const [items] = await db.query(`
      SELECT wishlist_id, item_id
      FROM wishlist
      WHERE wishlist_id = ?
    `, [wishlist_id]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'No wishlist items found for this customer' });
    }

    // Return the wishlist details
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Add item to cart (insert or add quantity)
router.post('/cart/:cart_id/add', async (req, res) => {
  const { cart_id } = req.params;
  let { item_id, quantity } = req.body;

  // Make sure quantity is a number
  quantity = parseInt(quantity, 10);

  if (!item_id || Number.isNaN(quantity)) {
    return res
      .status(400)
      .json({ message: 'item_id and a valid quantity are required' });
  }

  try {
    const [existingItem] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND item_id = ?',
      [cart_id, item_id]
    );

    if (existingItem.length > 0) {
      // Update quantity if item exists
      const newQuantity = existingItem[0].quantity + quantity;
      // If quantity would drop to 0 or below, remove the item entirely
      if (newQuantity <= 0) {
        await db.query(
          'DELETE FROM cart_items WHERE cart_id = ? AND item_id = ?',
          [cart_id, item_id]
        );
      } else {
        await db.query(
          'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_id = ?',
          [newQuantity, cart_id, item_id]
        );
      }
    } else {
      // Insert new item into cart
      await db.query(
        'INSERT INTO cart_items (cart_id, item_id, quantity) VALUES (?, ?, ?)',
        [cart_id, item_id, quantity]
      );
    }

    res.status(200).json({ message: 'Item added/updated in cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove item from cart (remove completely)
router.delete('/cart/:cart_id/remove', async (req, res) => {
  const { cart_id } = req.params;
  const { item_id } = req.body;

  if (!item_id) {
    return res.status(400).json({ message: 'item_id is required' });
  }

  try {
    const [existingItem] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND item_id = ?',
      [cart_id, item_id]
    );

    if (existingItem.length === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await db.query(
      'DELETE FROM cart_items WHERE cart_id = ? AND item_id = ?',
      [cart_id, item_id]
    );

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment existing item (e.g., quantity += 1)
router.post('/cart/:cart_id/addexistingitem', async (req, res) => {
  const { cart_id } = req.params;
  let { item_id, quantity } = req.body;

  // Default to 1 if not provided
  quantity = parseInt(quantity, 10) || 1;

  if (!item_id || Number.isNaN(quantity)) {
    return res
      .status(400)
      .json({ message: 'item_id and a valid quantity are required' });
  }

  try {
    const [existingItem] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND item_id = ?',
      [cart_id, item_id]
    );

    if (existingItem.length === 0) {
      // If the item doesn’t exist in the cart, return 404 or
      // optionally add it new if you want to allow that scenario
      return res
        .status(404)
        .json({ message: 'Item not found in cart. Add it first.' });
    }

    const newQuantity = existingItem[0].quantity + quantity;
    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_id = ?',
      [newQuantity, cart_id, item_id]
    );

    res.status(200).json({ message: 'Item quantity incremented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decrement existing item (e.g., quantity -= 1) or remove if it goes to 0
router.post('/cart/:cart_id/removeexistingitem', async (req, res) => {
  const { cart_id } = req.params;
  let { item_id, quantity } = req.body;

  // Default to -1 if not provided
  quantity = parseInt(quantity, 10) || -1;

  if (!item_id || Number.isNaN(quantity)) {
    return res
      .status(400)
      .json({ message: 'item_id and a valid quantity are required' });
  }

  try {
    const [existingItem] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND item_id = ?',
      [cart_id, item_id]
    );

    if (existingItem.length === 0) {
      return res
        .status(404)
        .json({ message: 'Item not found in cart' });
    }

    const newQuantity = existingItem[0].quantity + quantity;

    if (newQuantity <= 0) {
      // Remove the item entirely if quantity goes to 0 or below
      await db.query(
        'DELETE FROM cart_items WHERE cart_id = ? AND item_id = ?',
        [cart_id, item_id]
      );
      return res.status(200).json({ message: 'Item removed from cart' });
    }

    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_id = ?',
      [newQuantity, cart_id, item_id]
    );

    res.status(200).json({ message: 'Item quantity decremented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// // Create a new category
// router.post('/category', async (req, res) => {
//   const { vendor_id, categoryId, name, description, parentCategory, productCount } = req.body;

//   try {
//     // Insert a new category into the SellerCategories table
//     const [result] = await db.query(
//       'INSERT INTO SellerCategories (vendor_id, categoryId, name, description, parentCategory, productCount) VALUES (?, ?, ?, ?, ?, ?)',
//       [vendor_id, categoryId, name, description, parentCategory || null, productCount || 0]
//     );

//     // Return the created category details
//     res.status(201).json({
//       vendor_id,
//       categoryId,
//       name,
//       description,
//       parentCategory,
//       productCount: productCount || 0,
//       created_at: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('Error creating category:', error);
//     res.status(500).json({ error: error.message });
//   }
// });




// // Update a category by categoryId
// router.put('/category/:categoryId', async (req, res) => {
//   const { categoryId } = req.params;
//   const { vendor_id, name, description, parentCategory, productCount } = req.body;

//   try {
//     // Check if the category exists
//     const [existingCategory] = await db.query('SELECT * FROM SellerCategories WHERE categoryId = ?', [categoryId]);
//     if (existingCategory.length === 0) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     // Update the category in the SellerCategories table
//     const [result] = await db.query(
//       'UPDATE SellerCategories SET vendor_id = ?, name = ?, description = ?, parentCategory = ?, productCount = ? WHERE categoryId = ?',
//       [vendor_id, name, description, parentCategory || null, productCount || 0, categoryId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Category not found or no changes made' });
//     }

//     // Return the updated category details
//     res.json({
//       categoryId,
//       vendor_id,
//       name,
//       description,
//       parentCategory,
//       productCount: productCount || 0
//     });
//   } catch (error) {
//     console.error('Error updating category:', error);
//     res.status(500).json({ error: error.message });
//   }
// });





// // Delete a category by categoryId
// router.delete('/category/:categoryId', async (req, res) => {
//   const { categoryId } = req.params;

//   try {
//     // Check if the category exists
//     const [existingCategory] = await db.query('SELECT * FROM SellerCategories WHERE categoryId = ?', [categoryId]);
//     if (existingCategory.length === 0) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     // Delete the category from the SellerCategories table
//     const [result] = await db.query('DELETE FROM SellerCategories WHERE categoryId = ?', [categoryId]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Category not found or already deleted' });
//     }

//     // Return success message
//     res.json({ message: 'Category deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting category:', error);
//     res.status(500).json({ error: error.message });
//   }
// });





router.post('/payment/record', async (req, res) => {
  const { order_id, item_id, vendor_id, payment_amount, payment_method = 'card', status = 'paid' } = req.body;

  if (!order_id || !item_id || !vendor_id || !payment_amount) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const payment_id = Math.floor(Math.random() * 1000000000);
    const payment_date = new Date().toISOString();
    const payment_type = 'credit';

    // Step 1: Get the last balance for this vendor
    const [lastPayment] = await db.query(
      'SELECT total_balance_vendor FROM payment WHERE vendor_id = ? ORDER BY payment_date DESC LIMIT 1',
      [vendor_id]
    );

    const previous_balance = lastPayment.length > 0 ? parseFloat(lastPayment[0].total_balance_vendor) : 0;
    const new_balance = previous_balance + parseFloat(payment_amount);

    // Step 2: Insert new payment
    await db.query(
      `INSERT INTO payment (
        payment_id, order_id, payment_amount, payment_date, 
        payment_method, status, payment_type, total_balance_vendor, vendor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment_id, order_id, payment_amount, payment_date,
        payment_method, status, payment_type, new_balance, vendor_id
      ]
    );

    res.status(201).json({
      message: 'Payment recorded successfully.',
      payment_id,
      vendor_id,
      total_balance_vendor: new_balance
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message });
  }
});






// Fetch items by vendor_id
router.get('/vendor/:vendor_id/items', async (req, res) => {
  const { vendor_id } = req.params;

  try {
    // Fetch all items for the specific vendor_id
    const [items] = await db.query(
      'SELECT item_id, vendor_id, name, brand, size, color, item_condition, cost_price, selling_price, stock_quantity, imageURL, description FROM item WHERE vendor_id = ?',
      [vendor_id]
    );

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found for this vendor' });
    }

    // Return the list of items
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Fetch all customers (with filter options)
router.get('/customers', async (req, res) => {
  try {
    // SQL query to fetch all customers (filter and sorting logic can be added as needed)
    const [customers] = await db.query(`
      SELECT customer_id, name, email, phone, address, registration_date
      FROM customer
    `);

    // Returning the customer data
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});



// GET /customer/:customer_id
router.get('/customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    // Fetch the customer details including the new address columns
    const [customer] = await db.query(`
      SELECT
        customer_id,
        name,
        email,
        phone,
        address,  -- If you're still using the original address column
        registration_date,
        addressID1,
        addressID2,
        addressID3,
        addressID4
      FROM customer
      WHERE customer_id = ?
    `, [customer_id]);

    if (customer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Return the customer details
    res.json(customer[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Fetch item_id and its respective quantity for a specific cart_id
router.get('/cart/:cart_id/items', async (req, res) => {
  const { cart_id } = req.params;

  try {
    // Query to fetch item_id and quantity for the specific cart_id
    const [items] = await db.query(`
      SELECT item_id, quantity
      FROM cart_items
      WHERE cart_id = ?
    `, [cart_id]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found for this cart' });
    }

    // Return the array of item_id and quantity pairs
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Create a new order
router.post('/order', async (req, res) => {
  const { customer_id, order_date, order_status, payment_status, shipping_address, shipping_id, item_id, item_quantity, item_price } = req.body;

  if (!customer_id || !order_date || !item_id || !item_quantity || !item_price) {
    return res.status(400).json({ message: 'All required fields (customer_id, order_date, item_id, item_quantity, item_price) are required' });
  }

  const generateRandomId = () => {
    return Math.floor(Math.random() * 1000000000); 
  };
  
  const order_id = generateRandomId();

  const shipping_address_str = typeof shipping_address === 'object' ? JSON.stringify(shipping_address) : shipping_address;


  try {
    // Insert new order into the 'orders' table
    const [result] = await db.query(
      'INSERT INTO orders (order_id, customer_id, order_date, order_status, payment_status, shipping_address, shipping_id, item_id, item_quantity, item_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
      [order_id, customer_id, order_date, order_status || 'placed', payment_status || 'pending', shipping_address_str, shipping_id, item_id, item_quantity, item_price]
    );

    res.status(201).json({
      order_id: order_id,
      customer_id,
      order_date,
      order_status: order_status || 'placed',
      payment_status: payment_status || 'pending',
      shipping_address_str,
      shipping_id,
      item_id,
      item_quantity,
      item_price
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});



// Update an existing order by order_id
router.put('/order/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { order_status, payment_status, shipping_address, shipping_id, item_id, item_quantity, item_price } = req.body;

  try {
    // Check if the order exists
    const [existingOrder] = await db.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    if (existingOrder.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order in the 'orders' table
    const [result] = await db.query(
      'UPDATE orders SET order_status = ?, payment_status = ?, shipping_address = ?, shipping_id = ?, item_id = ?, item_quantity = ?, item_price = ? WHERE order_id = ?',
      [
        order_status || existingOrder[0].order_status,
        payment_status || existingOrder[0].payment_status,
        shipping_address || existingOrder[0].shipping_address,
        shipping_id || existingOrder[0].shipping_id,
        item_id || existingOrder[0].item_id,
        item_quantity || existingOrder[0].item_quantity,
        item_price || existingOrder[0].item_price,
        order_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found or no changes made' });
    }

    // Return the updated order details
    res.json({
      order_id,
      order_status: order_status || existingOrder[0].order_status,
      payment_status: payment_status || existingOrder[0].payment_status,
      shipping_address: shipping_address || existingOrder[0].shipping_address,
      shipping_id: shipping_id || existingOrder[0].shipping_id,
      item_id: item_id || existingOrder[0].item_id,
      item_quantity: item_quantity || existingOrder[0].item_quantity,
      item_price: item_price || existingOrder[0].item_price
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
});


// Fetch all orders by customer_id and group them by order_id
router.get('/orders/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    // Fetch all orders for the given customer_id
    const [orders] = await db.query('SELECT * FROM orders WHERE customer_id = ?', [customer_id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this customer_id' });
    }

    // Group orders by order_id
    const groupedOrders = orders.reduce((acc, order) => {
      if (!acc[order.order_id]) {
        acc[order.order_id] = [];
      }
      acc[order.order_id].push(order);
      return acc;
    }, {});

    // Return the grouped orders
    res.json(groupedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});





router.post('/vendor/signup', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Check if email already exists
    const [existingVendor] = await db.query('SELECT * FROM vendor WHERE email = ?', [email]);
    if (existingVendor.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Insert new vendor into the database
    const [result] = await db.query(
      'INSERT INTO vendor (name, email, phone) VALUES (?, ?, ?)', 
      [name, email, phone]
    );

    // Return success message along with a generated token
    const token = generateToken(result.insertId);  // Assuming this generates a token with vendor id
    res.status(201).json({
      vendor_id: result.insertId,
      name,
      email,
      token
    });
  } catch (error) {
    console.error('Error during vendor signup:', error);
    res.status(500).json({ error: error.message });
  }
});


// Vendor Login route (POST)
router.post('/vendor/login', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Check if the vendor exists using both name and email
    const [rows] = await db.query('SELECT * FROM vendor WHERE name = ? AND email = ?', [name, email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = rows[0];

    // Since there is no password in the request payload, you don't need to compare the password here
    // You can assume the login is based on name and email match
    
    // Generate a token (for authentication)
    const token = generateToken(vendor.id);

    // Return the token and vendor details
    res.json({
      id: vendor.vendor_id,
      name: vendor.name,
      email: vendor.email,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Generic CRUD operations for all tables
const createCrudRoutes = (tableName) => {
  // GET all records
  router.get(`/${tableName}`, async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${tableName}`);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET single record
  router.get(`/${tableName}/:id`, async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Record not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST new record
  router.post(`/${tableName}`, async (req, res) => {
    try {
      const columns = Object.keys(req.body).join(', ');
      const values = Object.values(req.body);
      const placeholders = values.map(() => '?').join(', ');
      
      const [result] = await db.query(
        `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
        values
      );
      res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT update record
  router.put(`/${tableName}/:id`, async (req, res) => {
    try {
      const updates = Object.entries(req.body)
        .map(([key, _]) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(req.body), req.params.id];

      const [result] = await db.query(
        `UPDATE ${tableName} SET ${updates} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Record not found' });
      }
      res.json({ id: req.params.id, ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE record
  router.delete(`/${tableName}/:id`, async (req, res) => {
    try {
      const [result] = await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Record not found' });
      }
      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};




// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '244139saiTeja', { expiresIn: '10h' });
};


// POST /signup
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,           
      registration_date,
    } = req.body;

    // Check if email already exists
    const [existingCustomer] = await db.query(
      'SELECT * FROM customer WHERE email = ?',
      [email]
    );

    if (existingCustomer.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Utility function to generate a random ID
    const generateRandomId = () => {
      return `${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    };

    const generateRandomAddressId = () => {
      return Math.floor(Math.random() * 1000000000); 
    };
    

    const customer_id = generateRandomId();
    const cart_id = generateRandomId();
    const wishlist_id = generateRandomId();

    const addressID1 = generateRandomAddressId();
    const addressID2 = generateRandomAddressId();
    const addressID3 = generateRandomAddressId();
    const addressID4 = generateRandomAddressId();


    // Insert new customer into the database,
    // now including addressID1..4 in the columns
    const [result] = await db.query(`
      INSERT INTO customer (
        customer_id,
        name,
        email,
        phone,
        address,
        registration_date,
        password,
        cart_id,
        wishList_id,
        addressID1,
        addressID2,
        addressID3,
        addressID4
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id,
      name,
      email,
      phone,
      address,
      registration_date,
      hashedPassword,
      cart_id,
      wishlist_id,
      addressID1,
      addressID2,
      addressID3,
      addressID4
    ]);

    // Generate a token (assuming you have a generateToken function)
    const token = generateToken(result.insertId);

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      token,
      customer_id,
      cart_id,
      wishlist_id,
      addressID1,
      addressID2,
      addressID3,
      addressID4
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Login route (POST)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if the customer exists
    const [rows] = await db.query('SELECT * FROM customer WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = rows[0];

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a token
    const token = generateToken(customer.id);
    res.json({ cartId: customer.cart_id, wishlistId: customer.wishList_id, customer_id: customer.customer_id, name: customer.name, email: customer.email, token, addressID1: customer.addressID1, addressID2: customer.addressID2,addressID3: customer.addressID3, addressID4: customer.addressID4 });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// POST /api/google-auth
router.post('/google-auth', async (req, res) => {
  try {
    const { name, email } = req.body;
    const phone = req.body.phone || '';
    const address = req.body.address || '';
    const registration_date = new Date().toISOString();

    // Check existing user
    const [existingCustomer] = await db.query(
      'SELECT * FROM customer WHERE email = ?',
      [email]
    );

    if (existingCustomer.length > 0) {
      // Existing user - login
      const customer = existingCustomer[0];
      const token = generateToken(customer.id);
      return res.json({
        token,
        customer_id: customer.customer_id,
        cartId: customer.cart_id,
        wishlistId: customer.wishList_id,
        addressID1: customer.addressID1,
        addressID2: customer.addressID2,
        addressID3: customer.addressID3,
        addressID4: customer.addressID4
      });
    }

    // New user - signup
    const generateRandomId = () => `${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const generateRandomAddressId = () => Math.floor(Math.random() * 1000000000);

    const customer_id = generateRandomId();
    const cart_id = generateRandomId();
    const wishlist_id = generateRandomId();
    const addressID1 = generateRandomAddressId();
    const addressID2 = generateRandomAddressId();
    const addressID3 = generateRandomAddressId();
    const addressID4 = generateRandomAddressId();

    // Generate random password for Google users
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await db.query(`
      INSERT INTO customer (
        customer_id, name, email, phone, address,
        registration_date, password, cart_id, wishList_id,
        addressID1, addressID2, addressID3, addressID4
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id, name, email, phone, address,
      registration_date, hashedPassword, cart_id, wishlist_id,
      addressID1, addressID2, addressID3, addressID4
    ]);

    const token = generateToken(customer_id);
    res.status(201).json({
      token,
      customer_id,
      cartId: cart_id,
      wishlistId: wishlist_id,
      addressID1,
      addressID2,
      addressID3,
      addressID4
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Create routes for all tables
const tables = [
  'cart',
  'customer',
  'employee',
  'item',
  'orders',
  'payment',
  'refund',
  'returnrequest',
  'shipping',
  'vendor',
  'wishlist',
  'worklogpresent'
];

tables.forEach(table => createCrudRoutes(table));

module.exports = router;