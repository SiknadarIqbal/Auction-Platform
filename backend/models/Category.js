import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    icon: {
        type: String,
        default: 'FaBox'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create slug from name
categorySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().split(' ').join('-');
    }
    next();
});

export default mongoose.model('Category', categorySchema);
