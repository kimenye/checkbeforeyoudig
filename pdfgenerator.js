var CONFIG = require('config').Environment;
var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var nodemailer = require("nodemailer");
var BufferStream = require('bufferstream')


var http = require('http');
var url = require('url');
var fs = require('fs');
var PDFDocument = require('pdfkit-memory');
var request = null;

PDFGenerator = function () {
};

PDFGenerator.prototype.generatePDF = function (callback, emailAddress, enquiry, req, res) {

    var options = {
        host:'maps.googleapis.com',
        port:80,
        method: 'get',
        path:'/maps/api/staticmap?sensor=false&center=-4.0434771,39.6682065&size=640x640&zoom=16' //TODO: To be created correctly
    };

    var imageData = '';

    var bufSize = 64 * 1024;
    var bufPos = 0;
    var targetBuffer = new Buffer(bufSize);
    var doc = new PDFDocument();

    var req = http.get(options, function(resp) {
        console.log("Got response: " + resp.statusCode);

        resp.on("data", function(chunk) {
            console.log("In data");
            var chunkLength = chunk.length;
            console.log("copy from " + bufPos);
            chunk.copy(targetBuffer, bufPos);
            bufPos += chunkLength;
        });

        resp.on('end', function() {
            console.log("Response ended");
            //trim the buffer
            if (bufPos != 0) {
                targetBuffer = targetBuffer.slice(0, bufPos);
            }
            console.log("Final buffer length " + targetBuffer.length);

            doc.imageFromBuffer(targetBuffer, 100, 100);
            mail(doc, emailAddress);
            callback(req, res, true);
        });
    });
}




// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
    service:"Gmail",
    auth:{
        user:from,
        pass:password
    }
});

if (request) {
    request.end();
}

// setup e-mail data with unicode symbols
function mail(doc, emailAddress) {

    doc.output(function (out) {
        console.log("Length of output is " + out.length);
        stream = new BufferStream({encoding:'binary', size:'flexible'});

        stream.write(out);
        console.log('The stream is writtable ' + stream.readable);
        stream.end();


        var mailOptions = {
            from:"Sprout Consulting <" + from + ">", // sender address
            to:emailAddress, // list of receivers
            subject:"Check Before you Dig Report", // Subject line
            html:"<b>Thank you for using Check Before you Dig. Attached is a pdf document of your search query results.</b>", // html body
            attachments:[
                {
                    fileName:"Report.pdf",
                    streamSource:stream
                }
            ]
        }


        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Message sent: " + response.message);
            }

            smtpTransport.close();
            // shut down the connection pool, no more messages
        });
    });


}

exports.PDFGenerator = PDFGenerator;