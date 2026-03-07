import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    targetAuctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: false,
        index: true
    },
    targetLabel: {
        type: String,
        trim: true
    },
    action: {
        type: String,
        required: true,
        enum: ['delete_account', 'deactivate_user', 'reactivate_user', 'manual_deactivation', 'auction_paused', 'auction_cancelled']
    },
    reason: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
