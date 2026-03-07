import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('seller', 'username email');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const {
            name, // match frontend 'name'
            description,
            category,
            condition,
            startingBid,
            minBid,
            buyNowPrice,
            endDate,
            yearMade,
            location
        } = req.body;

        // Handle Image Uploads
        let images = [];
        if (req.files) {
            images = req.files.map(file => file.path); // Cloudinary returns URL in 'path'
        }

        let auctionEndDate = endDate;
        if (req.body.duration) {
            const durationDays = parseInt(req.body.duration);
            auctionEndDate = new Date();
            auctionEndDate.setDate(auctionEndDate.getDate() + durationDays);
        }

        const product = new Product({
            title: name,
            description,
            category,
            condition,
            startingBid,
            minBid: minBid || startingBid,
            currentBid: startingBid,
            buyNowPrice: buyNowPrice || 0,
            endDate: auctionEndDate,
            images,
            image: images[0] || '',
            imageUrl: images[0] || '',
            yearMade,
            location,
            seller: req.user._id,
        });

        const createdProduct = await Product.create(product);
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            condition,
            startingBid,
            buyNowPrice,
            endDate,
            imageUrl,
            status
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.title = title || product.title;
            product.description = description || product.description;
            product.category = category || product.category;
            product.condition = condition || product.condition;
            product.startingBid = startingBid || product.startingBid;
            product.buyNowPrice = buyNowPrice || product.buyNowPrice;
            product.endDate = endDate || product.endDate;
            product.imageUrl = imageUrl || product.imageUrl;
            product.status = status || product.status;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

