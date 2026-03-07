import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        // Check if category exists
        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            description,
            icon: icon || 'FaList'
        });

        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
