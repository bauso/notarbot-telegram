const fs = require('fs')
const https = require('https')

exports.download = function(url, dest, cb) {
    console.log(url, dest);
    var file = fs.createWriteStream(dest);
    var request = https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb); 
        });
    }).on('error', function(err) {
        fs.unlink(dest);
        if (cb) cb(err.message);
    });
};
