const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const port = process.env.PORT || 3000;
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.originalname);
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

// Init app
const app = express();

// EJS
app.set('view engine', 'ejs');

// Public Folder
app.use(express.static('./public'));

app.get('/file/:name', function (req, res, next) {
  var options = {
    root: path.join(__dirname, 'public/uploads'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  var fileName = req.params.name
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
})

app.get('/', (req, res) => res.render('index'));

app.get('/data', function(req, res){
  let arr = []
  fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', (row) => {
    console.log(row);
    arr.push(row)
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    res.json({ data: arr });
  });
});

app.get('/add:id', function(req, res){
  const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
      {id: 'id', title: 'id'},
      {id: 'label', title: 'label'},
    ]
  });
  let arr = []
  fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', (row) => {
    console.log(row);
    arr.push({id:row.id,label:row.label})
  })
  .on('end', () => {
    arr.push({id:'id',label:req.params.id.replace(":", "")})
    console.log('CSV file successfully processed');
    csvWriter
    .writeRecords(arr)
    .then(()=> console.log('The CSV file was written successfully'));
  });
  console.log('all',arr)
});

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.render('index', {
        msg: err
      });
    } else {
      if(req.file == undefined){
        res.render('index', {
          msg: 'Error: No File Selected!'
        });
      } else {
        res.render('index', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        });
      }
    }
  });
});


app.listen(port, () => console.log(`Server started on port ${port}`));