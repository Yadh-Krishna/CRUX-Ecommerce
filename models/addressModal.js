const mongoose=require('mongoose');


const AddressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    hName:{type: String, required: true},
    street: { type: String, required: true },
    city: { type: String, required: true },
    pin: {type:String,required:true},
    country: { type: String, required: true },
    state: { type: String, required: true },      
    address_type: { 
      type: String, 
      enum: ["Home", "Work", "Other"], 
      default: "Home" 
  },
    isDeleted: { type: Boolean, default: false }, 
    isDefault:{type:Boolean,default:false},
     mobile_number: { type: String, required: true },
     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },{timestamps:true});


  module.exports = mongoose.model('address', AddressSchema);

  AddressSchema.pre("save", async function (next) {
    if (this.isDefault) {
        await this.constructor.updateMany({ user: this.user }, { isDefault: false });
    }
    next();
});
  