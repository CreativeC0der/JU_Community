const express=require('express');
const router=express.Router();
const {checkSessionValid,checkAdmin,checkGroupAdmin}=require('../middlewares');
const {connPromise}=require('../dbConnect');
const multer=require('multer')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'static/images')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })

const upload=multer({storage:storage})

router.get('/create',checkSessionValid,checkGroupAdmin,async(req,res)=>{
    const conn=await connPromise;
    const [group]=await conn.query('select * from ju_groups where groupId=?',[req.query.groupId])
    res.render('createPost',{group:group[0]});
})

router.post('/create',checkSessionValid,checkGroupAdmin,upload.single('postImage'),async(req,res)=>{
    console.log(req.file);
    console.log(req.body);
    const conn=await connPromise;
    const [results]=await conn.query('insert into posts(postId,postHeading,postContent,postImage,groupId) values(?,?,?,?,?)',
    [crypto.randomUUID(), req.body.postHeading, req.body.postContent, req.file.filename, req.query.groupId]);

    console.log(results);
    res.redirect(303,`/group/dashboard?groupId=${req.query.groupId}`);
})

module.exports=router