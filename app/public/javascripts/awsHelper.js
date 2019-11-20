(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//var myBucket = 'spectrumledgertest';
var myBucket ='spx-new-demo';
var bucketRegion = 'ap-southeast-1';
// var IdentityPoolId = 'ap-southeast-1:982af81a-b16d-408a-a55d-e5de42819314';
// var IdentityPoolId = 'ap-southeast-1:d1957974-4e8c-4be3-8c2f-c4c9a038f461';

// AWS.config.update({
//   region: bucketRegion,
//   credentials: new AWS.CognitoIdentityCredentials({
//     IdentityPoolId: IdentityPoolId
//   })
// });

var credentials = {
  accessKeyId: "AKIAXTWAYNRKJFMW6I4J",
  secretAccessKey:"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"
}

AWS.config.region = 'ap-southeast-1'; // Region
AWS.config.update(credentials);

var s3 = new AWS.S3({
  params: {Bucket: myBucket}
});

var songFolder = 'songs';

window.Upload = {
  upload_song: function upload_song(file, callback, progressHandler) {
    var fileName = file.name;
    var songFolderKey = encodeURIComponent(songFolder) + '/';
    var songKey = songFolderKey + fileName;
    var params = {
      Key: songKey,
      Body: file,
      ACL: 'public-read'
    }; 

    s3.upload(params, function(err, data) {
      s3.listObjects({Prefix: songKey}, function(err1, data1) {
        // console.log(data1);
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + myBucket + '/' + encodeURIComponent(songFolder) + '/';
        var songTempUrl = bucketUrl + encodeURIComponent(fileName);
        // console.log(songUrl);
        callback(err, data, songTempUrl);
      });
    }).on('httpUploadProgress', function(evt) {
      progressHandler(evt.loaded / evt.total);
    });
  }
}
},{}]},{},[1]);
