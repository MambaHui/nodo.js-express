//导入模块
const mongoose=require('mongoose');
let articleSchema=mongoose.Schema({
    title:String,
    content:String,
    createTime:Number,
    username:String
});

let articleModel=mongoose.model('articles',articleSchema);
//导出API
module.exports=articleModel;