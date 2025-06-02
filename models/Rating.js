const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userName: {
    type: String,
    default: 'Anonymous'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method to get average rating of a product
ratingSchema.statics.getAverageRating = async function(productId) {
  const obj = await this.aggregate([
    {
      $match: { productId: new mongoose.Types.ObjectId(productId) }
    },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      averageRating: obj[0] ? parseFloat(obj[0].averageRating.toFixed(1)) : 0,
      ratingCount: obj[0] ? obj[0].ratingCount : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ratingSchema.post('save', function() {
  this.constructor.getAverageRating(this.productId);
});

// Call getAverageRating before remove
ratingSchema.pre('remove', function() {
  this.constructor.getAverageRating(this.productId);
});

module.exports = mongoose.model('Rating', ratingSchema);
