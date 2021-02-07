const express = require('express');
const mongoose = require('mongoose');
const uploadController = require('../controllers/uploadController');
const config = require('../config')
const Image = require('../models/image')

var global = this;
const imageRouter = express.Router();

var chunksArray = [];

// router.get('/', uploadController.load_page);
// router.post('/saveImage', uploadController.image_save);

// module.exports = router;

module.exports = (upload) => {
    const url = config.mongoURI;
    const connect = mongoose.createConnection(url, { useNewUrlParser: true, useUnifiedTopology: true });

    let gfs;
    let chunksGfs;

    connect.once('open', () => {
        // initialize stream
        gfs = new mongoose.mongo.GridFSBucket(connect.db, {
            bucketName: "uploads"
        });

        chunksGfs = connect.db.collection('uploads.chunks')
    });

    /*
        POST: Upload a single image/file to Image collection
    */
    imageRouter.route('/upload')
        .post(upload.single('file'), (req, res, next) => {
            // console.log(upload);
            console.log(req.file);
            // check for existing images
            Image.findOne({ name: req.body.imageName })
                .then((image) => {
                    // console.log(req.body);
                    // console.log(req.file);
                    // console.log(image);
                    // console.log(req.body.imageKeywords);
                    // console.log(JSON.parse(req.body.imageKeywords));
                    if (image) {
                        return res.status(200).json({
                            success: false,
                            message: 'Image already exists',
                        });
                    }

                    let newImage = new Image({
                        
                        name: req.file.filename,
                        description: req.body.imageDescription,
                        price: req.body.imagePrice,
                        keywords: JSON.parse(req.body.imageKeywords),
                        // filename: req.file.filename,
                        imageId: req.file.id,
                    });

                    newImage.save()
                        .then((image) => {

                            res.status(200).json({
                                success: true,
                                image,
                            });
                        })
                        .catch((err) => {
                            res.status(500).json(err);
                            console.log("Tag1")
                            console.log(err)
                        });
                })
                .catch((err) => {
                    res.status(500).json(err);
                    console.log("TAag2");
                    console.log(err)
                });
        })
        .get((req, res, next) => {
            res.render('upload')
            // Image.find({})
            //     .then(images => {
            //         res.status(200).json({
            //             success: true,
            //             images,
            //         });
            //     })
            //     .catch(err => res.status(500).json(err));
        });

    /*
        GET: Delete an image from the collection
    */
    imageRouter.route('/delete/:id')
        .get((req, res, next) => {
            Image.findOne({ _id: req.params.id })
                .then((image) => {
                    if (image) {
                        Image.deleteOne({ _id: req.params.id })
                            .then(() => {
                                return res.status(200).json({
                                    success: true,
                                    message: `File with ID: ${req.params.id} deleted`,
                                });
                            })
                            .catch(err => { return res.status(500).json(err) });
                    } else {
                        res.status(200).json({
                            success: false,
                            message: `File with ID: ${req.params.id} not found`,
                        });
                    }
                })
                .catch(err => res.status(500).json(err));
        });

    /*
        GET: Fetch most recently added record
    */
    imageRouter.route('/recent')
        .get((req, res, next) => {
            Image.findOne({}, {}, { sort: { '_id': -1 } })
                .then((image) => {
                    res.status(200).json({
                        success: true,
                        image,
                    });
                })
                .catch(err => res.status(500).json(err));
        });

    /*
        POST: Upload multiple files upto 3
    */
    imageRouter.route('/multiple')
        .post(upload.array('file', 3), (req, res, next) => {
            res.status(200).json({
                success: true,
                message: `${req.files.length} files uploaded successfully`,
            });
        });

    /*
        GET: Fetches all the files in the uploads collection
    */
    imageRouter.route('/')
        .get((req, res, next) => {
            gfs.find().toArray().then(async (files) =>{
                
             
                // console.log(files)
                try{
                    if (!files || files.length === 0) {
                        return res.status(200).json({
                            success: false,
                            message: 'No files available'
                        });
                    }

                    files.map(file => {
                        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/svg') {
                            file.isImage = true;
                        } else {
                            file.isImage = false;
                        }
                    });

                    let imageArray = [];
                    let imagesArray = [];
                    let i=0;
                    // let xs = files.map(async (file) => {
                    //     await chunksGfs.find({files_id: file._id}).sort({n:1}).toArray((err, chunks) => {
                            
                    //         console.log(i);
                    //         i++;
                    //         imageArray.push(i);
                    //     });
                    // })
                    // async function f (files){
                    //     try{
                            await Promise.all(files.map(async (file) => {
                                await chunksGfs.find({files_id: file._id}).sort({n:1}).toArray().then((chunks) =>{

                                            if(!chunks || chunks.length === 0){            
                                            //No data found   
                                                console.log("No data found");
                                                return res.render('index', {
                                                    title: 'Download Error', 
                                                    message: 'No data found'});          
                                            }
            
                                            let fileData = [];          
                                            for(let i=0; i<chunks.length;i++){            
                                                //This is in Binary JSON or BSON format, which is stored               
                                                //in fileData array in base64 endocoded string format               
                                            
                                                fileData.push(chunks[i].data.toString('base64'));          
                                            }
                                            // chunksArray.push(chunks);
                                            // rans = "changed"
                                            //Display the chunks using the data URI format          
                                            let finalFile = 'data:' + file.contentType + ';base64,' 
                                                    + fileData.join(''); 
                                            let imageData = {};
                                            imageData.id = file._id;
                                            imageData.name = file.filename;
                                            imageData.image = finalFile;        
                                            imagesArray.push(imageData);
                                            console.log(i);
                                            i++;
                                            imageArray.push(i);
                                                    });
                                                }))
                                console.log("len: "+imagesArray.length);
                                // console.log(responses)
                                res.render('index', {
                                    title: 'Image File', 
                                    message: 'Image loaded from MongoDB GridFS',
                                    imageDataArray: imagesArray, 
                                    imageUrls: imageArray,
                                    imageID: "files[18]._id",
                                    imageName: "files[18].filename"});
                            
                    //     }catch(err){
                    //         console.log(err)
                    //     }
                        
                    // }

                    // f(files)
                    
                    // console.log(imageArray);
                    // console.log(results)
                }catch(err){
                    if(err){    
                        console.log(err);
                        return res.render('index', {
                        title: 'Download Error', 
                        message: 'Error retrieving chunks',
                        imageUrl: "finalFile",
                        imageID: "files[18]._id",
                        imageName: "files[18].filename",
                        error: err.errmsg});          
                    }
                
                }
                // await Promise.all(files.map(async (file) => {
                //     const contents = await fs.readFile(file, 'utf8')
                //     console.log(contents)
                // }));

                // files.forEach(fileItem => {
                //     // chunksGfs.find({files_id: fileItem._id}).sort({n:1}).toArray((err, chunks) => {
                        
                //         console.log(i);
                //         i++;
                //         imageArray.push(i);
                //     // });
                // });
                // console.log("tagX")
                // console.log(imageArray)
                
                
                // files.forEach(fileIt.lenem => {
                // for(let s = 0; s<1; s++){    
                    // let fileIstem = files[s]
                //    chunksGfs.find({files_id : files[0]._id})
                //     .sort({n: 1});
                //     chunksQuery.toArray(function(err, chunks){          
                //         if(err){    
                //             console.log(err);
                //             return res.render('index', {
                //             title: 'Download Error', 
                //             message: 'Error retrieving chunks', 
                //             error: err.errmsg});          
                //         }
                //         if(!chunks || chunks.length === 0){            
                //         //No data found   
                //             console.log("No data found");
                //             return res.render('index', {
                //                 title: 'Download Error', 
                //                 message: 'No data found'});          
                //         }
            
                //         let fileData = [];          
                //         for(let i=0; i<chunks.length;i++){            
                //             //This is in Binary JSON or BSON format, which is stored               
                //             //in fileData array in base64 endocoded string format               
                        
                //             fileData.push(chunks[i].data.toString('base64'));          
                //         }
                //         chunksArray.push(chunks);
                //         rans = "changed"
                //         //Display the chunks using the data URI format          
                //         let finalFile = 'data:' + files[0].contentType + ';base64,' 
                //                 + fileData.join(''); 
                //         // console.log(finalFile);
                //         getFiles(finalFile);
                        

                //         let imageObject = {obj: finalFile}; 
                //         // console.log(imageObject)    
                //         imageArray.push(imageObject) 
                //     });    
                // };
                
                // let chunksQuery = chunksGfs.find({files_id : files[18]._id})
                //     .sort({n: 1});
                //     chunksQuery.toArray()
                //     .then((chunks)=>{
                //         if(!chunks || chunks.length === 0){            
                //             //No data found   
                //                 console.log("No data found");
                //                 return res.render('index', {
                //                     title: 'Download Error', 
                //                     message: 'No data found'});          
                //             }
                //         let fileData = [];          
                //         for(let i=0; i<chunks.length;i++){            
                //             //This is in Binary JSON or BSON format, which is stored               
                //             //in fileData array in base64 endocoded string format               
                        
                //             fileData.push(chunks[i].data.toString('base64'));          
                //         }
                //         // console.log(chunksArray)
                //         chunksArray.push(fileData);
                //         // console.log(chunksArray)
                //         console.log("tag1: "+chunksArray.length)
                //         rans = "changed"
                //         //Display the chunks using the data URI format          
                //         let finalFile = 'data:' + files[18].contentType + ';base64,' 
                //                 + fileData.join(''); 
                //         // console.log(finalFile);
                        
                //         // getFiles(finalFile);
                        

                //         let imageObject = {obj: finalFile}; 
                //         // console.log(imageObject)    
                //         imageArray.push(imageObject) ;
                //     }).catch((err)=>{
                //         if(err){    
                //             console.log(err);
                //             return res.render('index', {
                //             title: 'Download Error', 
                //             message: 'Error retrieving chunks', 
                //             error: err.errmsg});          
                //         }
                //     });

                // let finalFiles = getFiles("");
                // console.log(chunksArray.length);
                

                // console.log(imageArray.length)

                
                
                  

                // res.status(200).json({
                //     success: true,
                //     files,
                // });
            });
        });

    /*
        GET: Fetches a particular file by filename
    */
    imageRouter.route('/file/:filename')
        .get((req, res, next) => {
            gfs.find({ filename: req.params.filename }).toArray((err, files) => {
                if (!files[0] || files.length === 0) {
                    return res.status(200).json({
                        success: false,
                        message: 'No files available',
                    });
                }

                res.status(200).json({
                    success: true,
                    file: files[0],
                });
            });
        });

    /* 
        GET: Fetches a particular image and render on browser
    */
    imageRouter.route('/image/:filename')
        .get((req, res, next) => {
            gfs.find({ filename: req.params.filename }).toArray((err, files) => {
                if (!files[0] || files.length === 0) {
                    return res.status(200).json({
                        success: false,
                        message: 'No files available',
                    });
                }

                if (files[0].contentType === 'image/jpeg' || files[0].contentType === 'image/png' || files[0].contentType === 'image/svg+xml') {
                    // render image to browser
                    res.set('Content-Type', files[0].contentType);
                    res.set('Content-Disposition', 'attachment; filename="' + files[0].filename + '"');

                    gfs.openDownloadStreamByName(req.params.filename).pipe(res);
                } else {
                    res.status(404).json({
                        err: 'Not an image',
                    });
                }
            });
        });

    /*
        DELETE: Delete a particular file by an ID
    */
    imageRouter.route('/file/del/:id')
        .post((req, res, next) => {
            console.log(req.params.id);
            gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
                if (err) {
                    return res.status(404).json({ err: err });
                }

                res.status(200).json({
                    success: true,
                    message: `File with ID ${req.params.id} is deleted`,
                });
            });
        });

    imageRouter.route('/findImage')
        .post((req, res) => {
            console.log(req.body.id);
            Image.findOne({imageId: req.body.id})
            // Image.findById(req.body.id)
            .then((result) => {
                // console.log(result);
                let imageDetails = {};
                imageDetails.description = result.description;
                imageDetails.price = result.price;
                imageDetails.keywords = result.keywords;
                res.json(result)
            }).catch(err=>{
                console.log(err)
            })
        });

    imageRouter.route('/download')
    .get((req, res)=>{
        gfs.find({ _id: req.body.id}).toArray(function (err, files) {
            console.log(req.body.id)
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }
            else if (!files[0]) {
                console.log("No such file")
                return res.status(404).send('Error on the database looking for the file.');
            }
        
            res.set('Content-Type', file.contentType);
            res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');
        
            var readstream = gfs.createReadStream({
              _id: req.body.id
            });
        
            readstream.on("error", function(err) { 
                res.end();
            });
            readstream.pipe(res);
          });
        
    })    

    return imageRouter;
};
