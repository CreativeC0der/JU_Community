const express=require('express')
const {checkSessionValid,getSession}=require('./middlewares')
const app=express()
const {connPromise}=require('./dbConnect');
const profileRouter=require('./routes/profile');
const landingRouter=require('./routes/landing');
const groupRouter=require('./routes/group');
const postRouter=require('./routes/posts');
const path=require('path')

app.use(getSession());

app.use(express.json());

app.use(express.urlencoded({
    extended:true
}));

app.use(express.static(path.join(process.cwd(), '/static')))

app.set('views',path.join(process.cwd(), '/views/pages'))
app.set('view engine','ejs')

app.get('/',(req,res)=>{
    res.render('root',{});
})

app.post('/login',async (req,res)=>{
    // let uid=req.body.userid;
    // let pass=req.body.password;
    console.log(req.body);
    const conn=await connPromise;
    const [results]=await conn.query('select * from users where userId=? and userPassword=?',Object.values(req.body))
    console.log(results);
    if(results.length>0){
        req.session.valid=true;
        req.session.user=results[0];
        res.redirect('/landing/home')
    }
    else{
        res.redirect(303,'/');
    }
        
})

app.use('/profile',profileRouter);
app.use('/landing',landingRouter);
app.use('/group',groupRouter);
app.use('/posts',postRouter);


app.listen('3000','localhost',(err)=>{
    console.log('listening on 3000');
    if(err)
        console.log(err);
})

module.exports=app