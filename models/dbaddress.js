const mongoose=require('mongoose');


const AddressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    landmark: { type: String },
    mobile_number: { type: String, required: true },
    alternate_number: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });
  
  module.exports = mongoose.model('Address', AddressSchema);