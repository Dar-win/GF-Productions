const load_page = (req, res) => {
    res.render('upload');
}

const image_save = (req, res) => {
    res.json('saved');
}

module.exports = {
    load_page,
    image_save
}