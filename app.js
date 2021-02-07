const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const mongoose = require('mongoose')
const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path')

const uploadRoutes = require('./routes/uploadRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const config = require('./config')
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan('dev'));

app.set('view engine', 'ejs');

mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(3000, ()=>{console.log("Listening on 3000")}))
  .catch((err) => console.log(err));

// app.listen(3000, ()=>{console.log("Listening on port 3000")});

const storage = new GridFsStorage({
    url: config.mongoURI,
    file: (req, file) => {
        // console.log(file)
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage });

// app.use('/', imageRouter(upload));

app.use('/', uploadRoutes(upload))
app.use('/transactions', transactionRoutes)
// app.get('/', (req, res)=>{
//     res.send("Okay");
// })