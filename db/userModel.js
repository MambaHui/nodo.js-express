//导入模块
const mongoose=require('mongoose');
let userSchema=mongoose.Schema({
    username:String,
    password:String,
    createTime:Number
});
let userModel=mongoose.model('users',userSchema);

//导出API
module.exports=userModel;