const express = require('express');
const router = express.Router();
const db = require('../config/database'); // adjust the path as needed



// Create a new category
router.post('/category', async (req, res) => {
  const { vendor_id, categoryId, name, description, parentCategory, productCount } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO SellerCategories (vendor_id, categoryId, name, description, parentCategory, productCount, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [vendor_id, categoryId, name, description, parentCategory || null, productCount || 0]
    );
    res.status(201).json({
      vendor_id,
      categoryId,
      name,
      description,
      parentCategory,
      productCount: productCount || 0,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});





// Rename a category (update only the 'name' field)
router.patch('/category/:categoryId/rename', async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;
  
    if (!name) {
      return res.status(400).json({ message: 'New category name is required' });
    }
  
    try {
      // Check if the category exists
      const [existingCategory] = await db.query('SELECT * FROM SellerCategories WHERE categoryId = ?', [categoryId]);
      if (existingCategory.length === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Update the category name
      await db.query('UPDATE SellerCategories SET name = ? WHERE categoryId = ?', [name, categoryId]);
      
      res.json({ message: 'Category renamed successfully', categoryId, name });
    } catch (error) {
      console.error('Error renaming category:', error);
      res.status(500).json({ error: error.message });
    }
  });

  


// Delete a category by categoryId
router.delete('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const [existingCategory] = await db.query('SELECT * FROM SellerCategories WHERE categoryId = ?', [categoryId]);
    if (existingCategory.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await db.query('DELETE FROM SellerCategories WHERE categoryId = ?', [categoryId]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a category by categoryId
router.put('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  const { vendor_id, name, description, parentCategory, productCount } = req.body;
  try {
    const [existingCategory] = await db.query('SELECT * FROM SellerCategories WHERE categoryId = ?', [categoryId]);
    if (existingCategory.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await db.query(
      'UPDATE SellerCategories SET vendor_id = ?, name = ?, description = ?, parentCategory = ?, productCount = ? WHERE categoryId = ?',
      [vendor_id, name, description, parentCategory || null, productCount || 0, categoryId]
    );
    res.json({
      vendor_id,
      categoryId,
      name,
      description,
      parentCategory,
      productCount: productCount || 0
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM SellerCategories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a category by categoryId
router.get('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const [category] = await db.query('SELECT * FROM SellerCategories WHERE categoryId = ?', [categoryId]);
    if (category.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories by vendor_id
router.get('/categories/vendor/:vendor_id', async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const [categories] = await db.query('SELECT * FROM SellerCategories WHERE vendor_id = ?', [vendor_id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found for this vendor' });
    }
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
