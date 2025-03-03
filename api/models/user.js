const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },

  // Profile Information
  gender: {
    type: String,
    required: true,
    enum: ['Men', 'Women', 'Other']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },
  hometown: {
    type: String,
    required: true,
    trim: true
  },

  // Dating Preferences
  datingPreferences: [{
    type: String
  }],
  lookingFor: {
    type: String,
    required: true
  },

  // Media and Content
  imageUrls: [{
    type: String,
    trim: true
  }],
  prompts: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    }
  }],

  // Connections and Matches
  likedProfiles: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  receivedLikes: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    image: {
      type: String,
      required: true
    },
    comment: {
      type: String,
      trim: true
    }
  }],
  matches: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  // User Status and Settings
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  visibility: {
    type: String,
    enum: ['public', 'hidden'],
    default: 'public'
  },
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  notificationPreferences: {
    type: Map,
    of: Boolean,
    default: {
      messages: true,
      matches: true,
      likes: true
    }
  }
}, {
  timestamps: true
});

// Create a 2dsphere index for location
userSchema.index({ "location.coordinates": "2dsphere" });

const User = mongoose.model('User', userSchema);

module.exports = User;