const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');
const multer = require('multer')
const {del,put}=require('@vercel/blob')


const upload = multer({ storage: multer.memoryStorage() })

router.get('/create', checkSessionValid, checkAdmin, async (req, res) => {
  const conn = await connPromise;
  const [group] = await conn.query('select * from ju_groups where groupId=?', [req.query.groupId])
  res.render('createPost', { group: group[0] });
})

router.post('/create', checkSessionValid, checkAdmin, upload.single('postImage'), async (req, res) => {
  let currDate = new Date().toISOString().replace('T', ' ').split('.')[0];
  const blob = await put(`PostImage ${Date.now()} ${req.file.originalname}`, req.file.buffer, {
    access: 'public',
  });
  console.log(blob);
  const conn = await connPromise;
  const query='insert into posts(timestamp,postId,postHeading,postContent,postImage,groupId) values(?,?,?,?,?,?)';
  const [results] = await conn.query(query,
                        [currDate,
                        crypto.randomUUID(), 
                        req.body.postHeading, 
                        req.body.postContent, 
                        blob.url, 
                        req.query.groupId]);

  console.log(results);
  res.redirect(303, `/group/dashboard?groupId=${req.query.groupId}`);
})

router.get('/edit',checkSessionValid,checkAdmin,async(req,res)=>{
  console.log(req.query.postId);
  const conn = await connPromise;
  const query = 'select * from posts where postId=?';
  const [[post]]=await conn.query(query,[req.query.postId])
  console.log(post);
  res.render('editPost',{post});
})

router.post('/edit',checkSessionValid,checkAdmin,upload.single('postImage'),async(req,res)=>{
  const conn=await connPromise;
  console.log('RECEIVED-----');
  console.log(req.body);
  if(req.file)
  {
      // Upload to vercel blobs
      const blob=await put(`PostImage ${Date.now()} ${req.file.originalname}`,req.file.buffer,{access:'public'})
      await conn.query('UPDATE posts SET postImage=? where postId=?',[blob.url,req.body.postId])
  }

  const query = 'UPDATE posts SET postHeading=?, postContent=? where postId=?';
  const [results] = await conn.query(query, 
                    [req.body.postHeading,
                    req.body.postContent,
                    req.body.postId]);
  console.log(results);
  res.redirect(`/group/dashboard?groupId=${req.body.groupId}`);
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
  console.log(req.query);
  await del(req.query.blobUrl);
  const conn=await connPromise;
  const query = 'DELETE FROM posts WHERE postId=?';
  const [results]=await conn.query(query,[req.query.postId])
  console.log(results);
  res.redirect(`/group/dashboard?groupId=${req.query.groupId}`);
})

module.exports = router