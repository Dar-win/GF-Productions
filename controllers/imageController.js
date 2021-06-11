const express = require('express');
const mongoose = require('mongoose');
const uploadController = require('../controllers/uploadController');
const config = require('../config')
const Image = require('../models/image')
const Jimp = require('jimp');
const path = require('path');
const _ = require('lodash');

const url = config.mongoURI;
const connect = mongoose.createConnection(url, { useNewUrlParser: true, useUnifiedTopology: true });

let gfs;

connect.once('open', () => {
    // initialize stream
    gfs = new mongoose.mongo.GridFSBucket(connect.db, {
        bucketName: "uploads"
    });

});

const images_render = (req, res) =>{
    res.render('portfolio')
}

const images_load = (req, res) => {
    Image.find().sort({createdAt: -1})
            .then((images) => {
                let imagesArray = [];
                images.forEach((image) => {
                    let imageData = {};
                    imageData.id = image.imageId;
                    imageData.price = image.price;
                    imageData.description = image.description;
                    imageData.name = image.name;
                    imageData.alias = image.alias;
                    imageData.aspectRatio = image.aspectRatio;
                    imagesArray.push(imageData);

                })
                res.json({images: imagesArray})
            })
            .catch((err) => {
                res.send("Error")
                console.log(err)
            })
}

const image_download = (req, res) => {
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
}

const image_delete = (req, res) => {
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

        
}

const get_image_recent = (req, res) => {
    Image.findOne({}, {}, { sort: { '_id': -1 } })
        .then((image) => {
            res.status(200).json({
                success: true,
                image,
            });
        })
        .catch(err => res.status(500).json(err));
}

const image_delete_gfs = (req, res) => {
    gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
        if (err) {
            return res.status(404).json({ err: err });
        }

        res.status(200).json({
            success: true,
            message: `File with ID ${req.params.id} is deleted`,
        });
    });
}

module.exports = {
    images_render,
    images_load,
    image_download,
    image_delete,
    get_image_recent,
    image_delete_gfs
}
