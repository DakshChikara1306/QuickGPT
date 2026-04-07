import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    credits:{type:Number, default:20}
})

// hash password before saving user
userSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
});
const User = mongoose.model('User', userSchema);

export default User;