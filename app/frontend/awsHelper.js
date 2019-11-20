var myBucket = 'spectrumledgertest';
var bucketRegion = 'ap-southeast-1';
var IdentityPoolId = 'ap-southeast-1:982af81a-b16d-408a-a55d-e5de42819314';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  params: {Bucket: myBucket}
});

var songFolder = 'songs';

window.Upload = {
  upload_song: function upload_song(file, callback) {
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
    });
  }
}