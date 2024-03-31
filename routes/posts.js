const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');
const multer = require('multer')
const {put}=require('@vercel/blob')


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/images')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: multer.memoryStorage() })

router.get('/create', checkSessionValid, checkAdmin, async (req, res) => {
  const conn = await connPromise;
  const [group] = await conn.query('select * from ju_groups where groupId=?', [req.query.groupId])
  res.render('createPost', { group: group[0] });
})

router.post('/create', checkSessionValid, checkAdmin, upload.single('postImage'), async (req, res) => {
  console.log(req.file);
  console.log(req.body);
  const blob = await put(req.file.originalname+'--'+Date.now(), req.file.buffer, {
    access: 'public',
  });
  console.log(blob);
  const conn = await connPromise;
  const query='insert into posts(postId,postHeading,postContent,postImage,groupId) values(?,?,?,?,?)';
  const [results] = await conn.query(query,
                        [crypto.randomUUID(), 
                        req.body.postHeading, 
                        req.body.postContent, 
                        blob.url, 
                        req.query.groupId]);

  console.log(results);
  res.redirect(303, `/group/dashboard?groupId=${req.query.groupId}`);
})

module.exports = router