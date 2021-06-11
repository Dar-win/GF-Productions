const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const mongoose = require('mongoose')
const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path')
const dotenv = require('dotenv').config();
const vhost = require('vhost')

const transactionRoutes = require('./routes/transactionRoutes');
const ImageStorage = require('./helpers/ImageStorage')
const config = require('./config');
const imageRoutes = require('./routes/imageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan('dev'));

app.set('view engine', 'ejs');

mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(8080, ()=>{console.log("Listening on 8080")}))
  .catch((err) => console.log(err));

// app.listen(3000, ()=>{console.log("Listening on port 3000")});

const storageGridFs = new GridFsStorage({
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

const storageImageStorage = ImageStorage();


const fileFilter = (req, file, cb) => {
    if (file.mimetype ==='image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const uploadGridFs = multer({ storage: storageGridFs });
const uploadImageStorage = multer({
    storage: storageImageStorage,
    fileFilter: fileFilter
});

// app.use('/', imageRouter(upload));

// app.use('/portfolio', uploadRoutes(uploadGridFs, uploadImageStorage))
const uploadApp = express();
app.use('/upload', uploadRoutes(uploadGridFs, uploadImageStorage))

// app.use(vhost('upload.localhost:3000', function (req, res) {
//     res.send("Gone")
// }));
app.use('/portfolio', imageRoutes)
app.use('/transactions', transactionRoutes)
app.get('/about', (req, res) => {
    res.render("about")
})
app.get('/videos', (req, res) => {
    res.render("videos")
})
app.get('/', (req, res) => {
    res.render("home")
});

app.get('/login', (req, res)=>{
    res.render("login")
})
