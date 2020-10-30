## 1.使用Express-generator初始化项目
```
    npm install express-generator -g
    express --view=ejs ArticleERP // --view=ejs指定模版引擎是ejs
    cd ArticleERP
    npm install
    npm start //nodemon ./bin/www
```

## 2.详解express-generator脚手架搭建的项目架构
+ package.json：项目信息的描述文件
    + scripts属性里面可以配置npm的快捷命令
        + npm run 命令文件
    + cookie-parser：用于解析cookie会话数据
    + morgan：是一个日志工具
    + serve-favicon：用于设置网站的favicon
        + npm i serve-favicon -S
    + body-parser：用于解析http请求体中的body数据
        + req.query：只能解析get请求的查询字符串
        + req.body：能解析post请求主题的信息
    + express-session：在服务端记录用户的简单信息
        + npm i express-session -S

## 3.数据库集合结构
+ 在项目根目录里面新建db文件夹
    + npm i mongoose -S
    + 用于存放数据库连接和集合结构
    + connect.js：数据库连接文件
    + userModel.js：用户集合文件
    + articleModel.js：文章集合文件
> connect.js
```javascript
//代码如下
    //导入模块
    const express=require('express');
    //连接数据库
    mongoose.connect('mongodb://localhost/project',{});

    var db=mongoose.connection;

    db.on('error',function(){
        console.log('数据库连接错误');
    });
    db.on('open',function(){
        console.log('数据库连接成功');
    })
```
> userModel.js
```javascript
//代码如下
    //导入模块
    const express=require('mongoose');
    let userSchema=mongoose.Schema({
        username:String,
        password:String,
        createTime:Number
    });
    let userModel=mongoose.model('users',userSchema);

    //导出API
    module.exports=userModel;
```
> articleModel.js
```javascript
//代码如下
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
```

## 4.public目录和views目录结构改造
+ public
    + 包含stylesheets,images,javascripts等静态资源
+ views
    + 所有html文件放入(除了error.html以外)
    + 提取相同部分,利用ejs的include引入
        + <%-include('head',{})%>
        + <%-include('bar',{})%>
    + 改造css,js,img的url地址,以pubilc为根目录

## 5.路由说明
| 路由             | 功能               | 请求方式 | 传参                        | 返回值         | 说明                                                       |
|:-----------------|:-------------------|:---------|:----------------------------|:---------------|:-----------------------------------------------------------|
| /                | 编译index.ejs模版  | get      | page,size                   | 返回index页面  | 无                                                         |
| /regist          | 编译regist.ejs模版 | get      | 无                          | 返回regist页面 | 无                                                         |
| /login           | 编译login.ejs模版  | get      | 无                          | 返回login页面  | 无                                                         |
| /write           | 编译write.ejs模版  | get      | 无                          | 返回write页面  | 登录后访问,有id是编辑页,无id是新增页                       |
| /detail          | 编译detail.ejs模版 | get      | id                          | 返回detail页面 | 无                                                         |
| /users/regist    | 注册业务           | post     | username,password,password2 | 重定向         | 注册成功重定向到/login,失败重定向到/regist                 |
| /users/logout    | 退出登录业务       | get      | 无                          | 重定向         | 退出登录后重定向到/login                                   |
| /articles/write  | 文章修改和新增业务 | post     | title,content,username,id   | 重定向         | 有id是修改业务,无id是新增业务,成功重定向/,失败重定向/write |
| /articles/delete | 文章删除业务       | get      | id                          | 重定向         | 失败成功都重定向到/                                        |
| /articles/upload | 文件上传业务       | post     | file                        | json           | {err:0,msg:'图片路径'}                                     |
> 【注】:除了/login和/regist以外,其他路由都需要登陆以后才能访问

## 6.app.js
```javascript
    //配置服务端session
    app.use(session({
    secret:'sz2009Html5',
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:1000*60*60 //指定session的有效时长,单位是毫秒
    }
    }))

    //连接数据库
    var db=require('./db/connect')
```
## 7.模版子路由
> routes/index.js
```javascript
    var express = require('express');
    var router = express.Router();

    //首页路由
    router.get('/',(req,res,next)=>{
    res.render('index',{})
    });
    //注册路由
    router.get('/regist',(req,res,next)=>{
    res.render('regist',{})
    });
    //登录路由
    router.get('/login',(req,res,next)=>{
    res.render('login',{})
    });
    //写文章/编辑文章页路由
    router.get('/write',(req,res,next)=>{
    res.render('write',{})
    });
    //详情页路由
    router.get('/detail',(req,res,next)=>{
    res.render('detail',{})
    });

    module.exports = router;
```
> 【注】:
+ 在这里把页面子路由完成以后,更新模版里面的'页面'链接:主要是超链接a的href属性以及一些外链src
+ 更新app.js里面关于模版页面的子路由配置,添加代码如下:
```javascript
    var indexRouter = require('./routes/index');//导入模版子路由
    app.use('/', indexRouter);//配置模版子路由
```

## 8.用户子路由
> routes/users.js
```javascript
    const express =require('express');
    let router=express.Router();
    let userModel = require('../db/userModel');

    /*
    注册接口
    业务接口说明:注册业务
    请求方式:post请求
    传参:username,password,password2
    返回值:重定向,注册成功重定向到/login,失败重定向到/regist
    */
    router.post('/regist',(req,res,next)=>{
        // console.log(req.body);
        //接收post数据
        let {username,password,password2}=req.body;//解构赋值
        //数据验证任务,在这里完成
        //查询是否存在这个用户
        userModel.find({username}).then(docs=>{
        if(docs.length>0){
            // res.send('用户已存在')
            res.redirect('/regist');
        }else{
            //用户不存在,开始注册
            let createTime=Date.now();
            //插入数据
            userModel.insertMany({
            username,
            password,
            createTime
            }).then(docs=>{
            // res.send('注册成功')
            res.redirect('/login');
            }).catch(err=>{
            // res.send('注册失败')
            res.redirect('/regist');
            })
        }
        })
    });
    /* 
    登录接口
    业务接口说明:登录业务
    请求方式:post请求
    传参:username,password
    返回值:重定向,登录成功重定向到/,失败重定向到/login
    */
    router.post('/login',(req,res,next)=>{
        //接受post数据
        let {username,password}=req.body;
        //操作数据库
        userModel.find({username,password})
        .then(docs=>{
        if(docs.length>0){
            // res.send('登录成功');
            req.session.username=username;
            req.session.isLogin=true;
            res.redirect('/')
        }else{
            // res.send('用户名或者密码错误');
            res.redirect('/login');
        }
        })
        .catch(()=>{
        // res.send('登录失败')
        res.redirect('/login');
        })
    });
    /* 
    退出登录接口:
    业务接口说明:退出登录业务
    请求方式:get请求
    传参:无
    返回值:重定向到/login
    */
    router.get('/logout',(req,res,next)=>{
    // console.log(req.session);
    req.session.username=null;
    req.session.isLogin=false;
    // console.log(req.session);
    res.redirect('/login');
    });

    module.exports = router;
```
> 【注】:
+ 在这里把页面子路由完成以后,更新模版里面的用户业务链接
    + bar.ejs里面<a href="/users/logout">退出</a>
+ 更新app.js里面关于模版页面的子路由配置,添加代码如下:
```javascript
    var usersRouter = require('./routes/users');//导入用户子路由
    app.use('/users', usersRouter);//配置用户子路由
```

## 9.文章子路由
> routes/articles.js
```javascript
    const express=require('express');
    const fs=require('fs');
    const path=require('path');
    let router=express.Router();
    var multiparty=require('multiparty');
    //连接数据库
    let articleModel=require('../db/articleModel');
    /* 
    文章修改和新增接口
        业务接口说明:文章修改和新增业务,登录后才能访问
        请求方式:post请求
        传参:title,content,username,id
        返回值:重定向,有id是修改业务,无id是新增业务,成功重定向/,失败重定向/write
    */
    router.post('/write',(req,res,next)=>{
        //接收post数据
        let {title,content,username,id}=req.body;
        //当前时间
        let createTime=Date.now();
        if(id){
            //修改文章
            id=new Object(id);
            articleModel.updateOne({_id:id},{
                title,
                content,
                createTime,
                username
            }).then(data=>{
                // res.send('文章修改成功');
                res.redirect('/');
            }).catch(err=>{
                // res.send('文章修改失败')
                res.redirect('/write');
            })
        }else{
            //新增文章
            //插入数据库
            let username=req.session.username;
            articleModel.insertMany({
                username,
                title,
                content,
                createTime
            }).then(data=>{
                // res.send('文章写入成功');
                res.redirect('/');
            }).catch(err=>{
                // res.send('文章写入失败')
                res.redirect('/write');
            })
        }
    })
    /* 
    文章删除接口
        业务接口说明:文章删除业务
        请求方式:get请求
        传参:id
        返回值:失败成功都重定向到/
    */
    router.get('/delete',(req,res,next)=>{
        let id =req.query.id;
        id= new Object(id);
        //删除
        articleModel.deleteOne({_id:id})
        .then(data=>{
            // res.send('文章删除成功');
            res.redirect('/');
        })
        .catch(err=>{
            // res.send('文章删除失败');
            res.redirect('/');
        })
    })
    /* 
    图片上传接口
        业务接口说明:图片上传业务
        请求方式:post请求
        传参:file,使用的复文本编辑插件xheditor里面上传的图片文件有个name是filedata
        返回值:json格式,例如:{err:0,msg:'图片路径'}
    */
    router.post('/upload',(req,res,next)=>{
        //每次访问该接口,都新建一个form对象来解析文件数据
        var form =new multiparty.Form();
        form.parse(req,(err,field,files)=>{
            if(err){
                console.log("文件上传失败");
            }else{
                console.log('---field---');
                console.log(field);
                var file=files.filedata[0];
                console.log('---file---');
                console.log(file);
                //读取流
                var read =fs.createReadStream(file.path);
                //写入流
                var write=fs.createWriteStream(path.join(__dirname,'..','public/images',file.originalFilename));
                //管道流
                read.pipe(write);
                write.on('close',()=>{
                    console.log('图片上传完成');
                    res.send({
                        err:0,
                        msg:'/images'+file.originalFilename
                    })
                })
            }
        })
    })


    module.exports=router;
```
> 【注】:
+ 在文章路由里面需要接收表单上传的文件,body-parser不擅长,我们使用multiparty模块
    + npm install multiparty
+ 在这里把页面子路由完成以后,更新模版里面的用户业务链接
    + index.ejs里面<a href="/articles/delete">删除</a>
+ 更新app.js里面关于模版页面的子路由配置,添加代码如下:
```javascript
var articlesRouter = require('./routes/articles');//导入文章子路由
app.use('/articles',articlesRouter);//配置文章子路由
```

## 10.使用Postman测试所有接口

## 11.模版子路由-首页路由(/)
```javascript
//首页路由
router.get('/', (req, res, next) => {
  console.log(req.query);
  //数据类型是number
  let page = parseInt(req.query.page || 1);//如果page没有传,默认是第一页
  let size = parseInt(req.query.size || 3);//如果size没有传,默认一页显示3条文章
  let username = req.session.username;
  articleModel.find().count().then(total => {
    //total就是文章的总条数
    //获取总页数
    var pages = Math.ceil(total / size);
    //第二步:分页查询
    articleModel.find().sort({ 'createTime': -1 }).skip((page - 1) * size).limit(size)
      .then(docs => {
        //doc不是传统意义的js数组,要使用slice()方法把它转化成js数组
        var arr = docs.slice();
        for (let i = 0; i < arr.length; i++) {
          //原有的文档字段值,不能修改吗？
          //添加一个新的字段,来表示格式化的时间
          arr[i].createTimeZh = moment(arr[i].createTime).format('YYYY-MM-DD HH:mm:ss');
        };
        res.render('index', {
          data: {
            list: arr,
            total: pages,
            username
          }
        });
      })
      .catch(err => {
        res.redirect('/');
      })
  })
});
```
> 注意
+ page和size需要设置默认值
+ port表示排序
+ skip表示跳过
+ limit表示选取前几天数据
+ 需要在查询到的分页记录里面,给每个数据添加一个createTimeZH字段,里面是格式化好的时间
    + npm i moment -S
    + 在打印的时候是无法打印出来的
## 12.完成模版-index.ejs
```html
<body>
    <%-include('bar',{username:data.username})%>
    <div class="list">
        <%data.list.map((ele,idx)=>{%>
            <div class="row">
            <span><%=(idx+1)%></span>
            <span><%=ele.username%></span>
            <span><a href="/detail?id=<%=ele._id%>"><%=ele.title%></a></span>
            <span><%=ele.createTimeZh%></span>
            <span>
                <a href="/write?id=<%=ele._id%>">编辑</a>
                <a href="/articles/delete?id=<%=ele._id%>">删除</a>
            </span>
            </div>
        <%})%>
        <div class="pages">
        <%for(let i=1;i<=data.total;i++){%>
            <a href="/?page=<%=i%>"><%=i%></a>
        <%}%>
        </div>
    </div>
</body>
```
## 13.完成模版-login.ejs
```html
<form method="post" action="/users/login">
```
## 14.完成模版-regist.ejs
```html
<form method="post" action="/users/regist">
```
## 15.模版子路由-写文章路由(/write)
```javascript
//写文章/编辑文章页路由
router.get('/write', (req, res, next) => {
  var id=req.query.id;
  if(id){
    //编辑
    id = new Object(id);
    //用id在数据库查询
    articleModel.findById(id)
    .then(doc=>{
      console.log(doc);
      res.render('write',{doc,username:req.session.username});
    })
    .catch(err=>{
      res.redirect('/');
    });
  }else{
    //新增
    var doc = {
      _id:'',
      username:req.session.username,
      title:'',
      content:''
    };
    res.render('write',{doc,username:req.session.username});
  }
});
```
## 16.完成模版-write.ejs
```html
<body>

  <%-include('bar',{username:username})%>
  
  <div class="article">
    <form method="post" action="/articles/write">
      <%# POST请求不能使用query字符串的方式传值%>
      <%# 我们使用input隐藏域传值%>
      <input type="hidden" name="id" value="<%=doc._id%>">
      <input type="hidden" name="username" value="<%#=doc.username%>">
      <%if(doc._id){%>
        <input type="text" name="title" placeholder="<%=doc.title%>" value="<%=doc.title%>">
        <textarea name="content" class="xheditor"><%=doc.content%></textarea>
        <input type="submit" value="修改">
      <%}else{%>
        <input type="text" name="title" placeholder="请输入文章标题" value="这是文章标题">
        <textarea name="content" class="xheditor">请输入文章内容</textarea>
        <input type="submit" value="发布">
      <%}%>
    </form>
  </div>

  <script type="text/javascript" src="/xheditor/jquery/jquery-1.4.4.min.js"></script>
  <script type="text/javascript" src="/xheditor/xheditor-1.2.2.min.js"></script>
  <script type="text/javascript" src="/xheditor/xheditor_lang/zh-cn.js"></script>
  <script>
    $('.xheditor').xheditor({
      tools:'full',
       skin:'default',
       upImgUrl:'/articles/upload',
       html5Upload:false,
       upMultiple:1
    })
  </script>
</body>
```
## 17.模版子路由-详情页路由(/detail)
```javascript
router.get('/detail', (req, res, next) => {
  var id=req.query.id;
  //用id查询
  articleModel.findById(id)
  .then(doc=>{
    doc.createTimeZh=moment(doc.createTime).format('YYYY-MM-DD HH:mm:ss');
    res.render('detail',{
      doc,
      username:req.session.username
    })
  })
  .catch(err=>{
    res.redirect('/');
  })
});
```
## 18.完成模版-detail.ejs
```html
<body>

  <%-include('bar',{username:username})%>
  
  <div class="detail">
    <div class="title"><%=doc.title%></div>
    <div class='desc'>
      <span>作者：<%=doc.username%></span>
      <span>发布时间：<%=doc.createTimeZh%></span>
    </div>
    <div class="content"><%=doc.content%></div>
  </div>

</body>
```
## 19.优化
### 19.1.用户登录拦截
```javascript
//用户拦截
app.all('*', (req, res, next) => {
  let { username } = req.session;//获取用户名
  let url = req.path;
  if (url != '/login' && url != '/regist') {
    //如果不是登录或者注册,需要有用户名(登录状态)
    if (!username) {
      //用户未登录
      res.redirect('/login');
    } else {
      next();
    }
  } else {
    next();
  }

});
```
### 19.2.设置编辑/删除权限
> 只有文章的作者和用户名相同的时候,才显示编辑/删除按钮
```html
<span>
    <%if(ele.username==data.username){%>
    <a href="/write?id=<%=ele._id%>">编辑</a>
    <a href="/articles/delete?id=<%=ele._id%>">删除</a>
    <%}%>
</span>
```
### 19.3.用户密码加密
+ 登录注册优化
  + 对数据库的密码进行加密
  + npm i bcrypt -S
  + 通过明文产生密文
    + var bcrypt = require('bcrypt');
    + 密码密文 = bcrypt.hashSync(密码明文,加盐的字符串的长度);
    + 把密码存入数据库
  + 检测密文是否由指定明文产生
    + bcrypt.compareSync(指定明文,密码密文)
    + 结果为true表示密文是指定明文产生的
    + 结构为false表示密文不是指定明文的产生的
> /users/regist 注册业务路由
```javascript
//【注】:模块包一定要引入
const bcrypt=require('bcrypt');

router.post('/regist',(req,res,next)=>{
    // console.log(req.body);
    //接收post数据
    let {username,password,password2}=req.body;//解构赋值
    //【注】密码不直接存入数据,先加密,再存入数据库
    password = bcrypt.hashSync(password,10);
    //数据验证任务,在这里完成
    //查询是否存在这个用户
    userModel.find({username}).then(docs=>{
      if(docs.length>0){
          // res.send('用户已存在')
          res.redirect('/regist');
      }else{
        //用户不存在,开始注册
        let createTime=Date.now();
        //插入数据
        userModel.insertMany({
          username,
          password,
          createTime
        }).then(docs=>{
          // res.send('注册成功')
          res.redirect('/login');
        }).catch(err=>{
          // res.send('注册失败')
          res.redirect('/regist');
        })
      }
    })
});
```
> /users/login 登录业务路由
```javascript
router.post('/login',(req,res,next)=>{
    //接受post数据
    let {username,password}=req.body;
    //操作数据库
    userModel.find({username})
    .then(docs=>{
      if(docs.length>0){
        //说明有这个用户
        //【注】检验数据库里面的密文是否由你输入的明文密码产生
        var result = bcrypt.compareSync(password,docs[0].password)
        if(result){
          // res.send('登录成功');
          req.session.username=username;
          req.session.isLogin=true;
          res.redirect('/');
          // console.log(req.session);
        }
        else{
          // res.send('用户名或者密码错误');
          res.redirect('/login');
        }
        
      }else{
        // res.send('用户名或者密码错误');
        res.redirect('/login');
      }
    })
    .catch(()=>{
      // res.send('登录失败')
      res.redirect('/login');
    })
});
```
## 20.项目上传到GitHup
### 20.1 得到Git管理
> $ git init
### 20.2 创建gitignore文件
> .gitignore 这里面写入不想上传的文件及文件夹
### 20.3 把所有文件写入存储区
> $ git add .
### 20.4 把暂存区写入历史区
> $ git commit -m "历史信息"
### 20.5 添加仓库地址
> $ git remote add "别名" "远程仓库链接"
### 20.6 上传远程仓库
> $ git push  "别名"