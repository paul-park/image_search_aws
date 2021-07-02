/**
 * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * This file is licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License. A copy of
 * the License is located at
 *
 * http://aws.amazon.com/apache2.0/
 *
 * This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 */

// snippet-comment:[These are tags for the AWS doc team's sample catalog. Do not remove.]
// snippet-sourcedescription:[s3_PhotoViewer.js demonstrates how to allow viewing of photos in albums stored in an Amazon S3 bucket.]
// snippet-service:[s3]
// snippet-keyword:[JavaScript]
// snippet-sourcesyntax:[javascript]
// snippet-keyword:[Amazon S3]
// snippet-keyword:[Code Sample]
// snippet-sourcetype:[full-example]
// snippet-sourcedate:[2019-05-07]
// snippet-sourceauthor:[AWS-JSDG]

// ABOUT THIS JAVASCRIPT SAMPLE: This sample is part of the SDK for JavaScript Developer Guide topic at
// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html

// snippet-start:[s3.JavaScript.s3_PhotoViewer.complete]
//
// Data constructs and initialization.
//

// snippet-start:[s3.JavaScript.s3_PhotoViewer.config]
// **DO THIS**:
//   Replace BUCKET_NAME with the bucket name.
//
var albumBucketName = 'image-search-public';

// **DO THIS**:
//   Replace this block of code with the sample code located at:
//   Cognito -- Manage Identity Pools -- [identity_pool_name] -- Sample Code -- JavaScript
//
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:c936b2ba-b85e-4fa2-a6e4-bc0332631ada',
});

AWS.config.logger = console;

// Create a new service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
  //params: {Bucket: albumBucketName, Prefix: 'application'}
});

// Prepare to call Lambda function
lambda = new AWS.Lambda({region: 'us-east-1', apiVersion: '2015-03-31'});

// A utility function to create HTML.
function getHtml(template) {
  return template.join('\n');
}
// snippet-end:[s3.JavaScript.s3_PhotoViewer.config]


//
// Functions
//

// snippet-start:[s3.JavaScript.s3_PhotoViewer.listAlbums]
// List the photo albums that exist in the bucket.
function listAlbums() {
  s3.listObjects({Delimiter: '/'}, function(err, data) {
    if (err) {
      return alert('There was an error listing your albums: ' + err.message);
    } else {
      console.log(data)
      var albums = data.CommonPrefixes.map(function(commonPrefix) {
        console.log(commonPrefix)
        var prefix = commonPrefix.Prefix;
	      // console.log(prefix)
        var albumName = decodeURIComponent(prefix.replace('/', ''));
        // var albumName = decodeURIComponent(prefix.split('/')[1]);
	      // console.log(albumName);
      	if (albumName !== "results") {
                return getHtml([
                  '<li>',
                    '<button style="margin:5px;" onclick="viewAlbum(\'' + albumName + '\')">',
                    //'<button style="margin:5px;" onclick="viewAlbum(\'application/' + albumName + '\')">',
                      albumName,
                    '</button>',
                  '</li>'
                ]);
      	}
      });
      // console.log(albums)
      var message = albums.length ?
        getHtml([
          '<p>Click on an album name to view it.</p>',
        ]) :
        '<p>You do not have any albums. Please Create album.';
      var htmlTemplate = [
        '<h2>Albums</h2>',
        message,
        '<ul>',
          getHtml(albums),
        '</ul>',
      ]
      document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
    }
  });
}
// snippet-end:[s3.JavaScript.s3_PhotoViewer.listAlbums]

function invokeLambda(lambdaParams) {
  lambda.invoke(lambdaParams, function(err, data) {
    if (err) {
      prompt(err);
    } else {
      // data == 'results/' once lambda has finished
      var lambdaResults = JSON.parse(data.Payload);
      var albumInputName = lambdaResults.album;
      return albumInputName;
    }
  });
}

async function viewClosest(photoInputUrl, k, albumName) {
  console.log(photoInputUrl)
  var photoInputName = photoInputUrl.split('%2F')[1]
  // var photoInputName = photoInputUrl.split('/')[1]
  var photoInputRoot = photoInputName.split('.')[0];
  // launch lambda function to ssh into ec2
  // Call the Lambda function to collect the spin results
  console.log(photoInputName)
  var lambdaParams = {
    FunctionName : 'image_search_function',
    InvocationType : 'RequestResponse',
    LogType : 'None',
    Payload : JSON.stringify({photoUrl:photoInputUrl, photoName:photoInputName, k:k})
  };
//  var albumInputNamePromise = Promise.resolve(invokeLambda(lambdaParams));
//  albumInputNamePromise.then(value => {
//  var albumInputName = value
  lambda.invoke(lambdaParams, function(err, data) {
    if (err) {
      prompt(err);
    } else {
      // data == 'results/' once lambda has finished
      var lambdaResults = JSON.parse(data.Payload);
      var albumInputName = lambdaResults.album;
  //});
  //var resultHtml = renderResultHtml();
  //console.log(resultHtml);
  //console.log(photoInputUrl);
  //var albumInputName = 'results/' + photoInputName;
  //console.log(albumInputName);
//  var albumName = 'results';
  //var albumPhotosKey = encodeURIComponent(albumName) + '/';
  console.log(lambdaResults)
  var albumPhotosKey = albumInputName+photoInputRoot;
  s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
    if (err) {
      return alert('There was an error viewing your album: ' + err.message);
    }
    // 'this' references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    //var bucketUrl = href + albumBucketName + '/';
    var bucketUrl = href + albumBucketName + '/';

    var photos = data.Contents.map(function(photo) {
      console.log(photo)
      var photoKey = photo.Key;
      var photoUrl = bucketUrl + encodeURIComponent(photoKey);
      //console.log(photoKey);
      //console.log(photoUrl);
      //var k = Promise.resolve(document.getElementById("k"));
      return getHtml([
        '<div style="width:150px; float:left">',
	  '<div>',
            '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
	  '</div>',
	  '<div>',
	    photoKey.split('/').slice(2,4).join('/'),
          '</div>',
	'</div>',
      ])
    })
    var htmlTemplate = [
        '<div>',
          '<button onclick="listAlbums()">',
            'Back To Albums',
          '</button>',
        '</div>',
        '<div>',
          '<button onclick="viewAlbum(\'' + albumName + '\')">',
            'Back To ' + albumName,
          '</button>',
        '</div>',
        '<p>Showing ' + k + ' closest photo(s).<\p>',
        '<span>',
          '<div>',
            '<br/>',
            '<img style="width:128px;height:128px;" src="' + photoInputUrl + '"/>',
            '<div>',
              '<span>',
                photoInputUrl.split('/')[4].replace('%2F','/'),
              '</span>',
            '</div>',
          '</div>',
        '</span>',
        '<div>',
          getHtml(photos),
        '</div>',
	      '<div style="clear:both;"></div>',
        '<div>',
          '<button onclick="listAlbums()">',
            'Back To Albums',
          '</button>',
        '</div>',
        '<div>',
          '<button onclick="viewAlbum(\'' + albumName + '\')">',
            'Back To ' + albumName,
          '</button>',
        '</div>',
    ]
    document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
  })
  }
  })
}

function encode(data)
{
    var str = data.reduce(function(a,b){ return a+String.fromCharCode(b) },'');
    return btoa(str).replace(/.{76}(?=.)/g,'$&\n');
}

function getUrlByFileName(fileName,mimeType) {
          return new Promise(
              function (resolve, reject) {
                  bucket.getObject({Key: fileName}, function (err, file) {
                      var result =  mimeType + encode(file.Body);
                      resolve(result)
                  });
              }
          );
      }

const functionWithPromise = item => { return Promise.resolve(item) }

function getAndEncode(photo, bucketUrl) {
  return new Promise( function(resolve, reject) { 
    var photoKey = photo.Key;
    s3.getObject({Key: photoKey},function(err,file){ 
      if (err) {
        return alert('There was an error retrieving image: ' + err.message);
      }
      var photoUrl = bucketUrl + encodeURIComponent(photoKey);
      var photoInputUrl = 'data:image/jpg;base64,' +  encode(file.Body);
      var photoHtml =  getHtml([
         '<span>',
           '<div>',
             '<br/>',
             '<button class="search" name="' + photoUrl + '" >',
             // '<button class="search" name="image" >',
             '<img style="width:128px;height:128px;" src="' + photoInputUrl + '"/>',
             '</button>',
           '</div>',
          '<div>',
            '<span>',
              // photoKey.replace(photoKey, ''),
              // photoKey.split('/').slice(2,4).join('/'),
              photoKey.split('/')[1],
            '</span>',
          '</div>',
         '</span>',
       ]);
//       var photoHtml = '<span>\n<div>\n<br/>\n<button class="search" name="image" >\n<img style="width:128px;height:128px;" src="' + photoUrl + '"/>\n</button>\n</div>\n</span>'
    resolve(photoHtml);
    })
  });
};

var async_map = async function(data, albumName){
  console.log(data.Contents);
  //var photos = await data.Contents.map(getAndEncode(photo))
  var photos = Promise.all(data.Contents.map(async function(photo){ getAndEncode(photo); }))
  //console.log(photos);
  var message = photos.length ?
    '<p>The following photos are present.</p>' :
    '<p>There are no photos in this album.</p>';
  var htmlTemplate = [
    '<div>',
      '<button onclick="listAlbums()">',
        'Back To Albums',
      '</button>',
    '</div>',
    '<h2>',
      'Album: ' + albumName,
    '</h2>',
    message,
    'Click to find k closest photo(s). k=',
    '<select id="k">',
    '</select>',
    '<div>',
      getHtml(photos),
    '</div>',
    '<h2>',
      'End of Album: ' + albumName,
    '</h2>',
    '<div>',
      '<button onclick="listAlbums()">',
        'Back To Albums',
      '</button>',
    '</div>',
  ]
  document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
  for(var i=1; i<=10; i++){
    var select = document.getElementById("k");
    var option = document.createElement("OPTION");
    select.options.add(option);
    option.text = i;
    option.value = i;
  }
  var select = document.getElementById("k");
  var button = document.querySelectorAll(".search");
  button.forEach(item => item.addEventListener("click", () => { //console.log(item.type); 
                                                                  viewClosest(item.name, select.value, albumName); }));
}

// snippet-start:[s3.JavaScript.s3_PhotoViewer.viewAlbum]
// Show the photos that exist in an album.
function viewAlbum(albumName) {
  //var albumPhotosKey = encodeURIComponent(albumName) + '/_';
  var albumPhotosKey = encodeURIComponent(albumName) + '/';
  // var albumPhotosKey = 'application/' + encodeURIComponent(albumName) + '/';
  console.log(albumPhotosKey);
  s3.listObjects({Prefix: albumPhotosKey}, async function(err, data) {
    if (err) {
      return alert('There was an error viewing your album: ' + err.message);
    }
    // 'this' references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + '/';
    // console.log(bucketUrl);
    // console.log(albumPhotosKey);
    console.log(data.Contents);
//    var photos = await data.Contents.map(getAndEncode(photo))
  //  async_map(data, albumName).then(item => { console.log(item) }); 
  var photos_tmp = data.Contents.map(async photo => getAndEncode(photo, bucketUrl))
  Promise.all(photos_tmp).then( function(photos) {
  // console.log(photos);
  var message = photos.length ?
    '<p>The following photos are present.</p>' :
    '<p>There are no photos in this album.</p>';
  var htmlTemplate = [
    '<div>',
      '<button onclick="listAlbums()">',
        'Back To Albums',
      '</button>',
    '</div>',
    '<h2>',
      'Album: ' + albumName,
    '</h2>',
    message,
    'Click to find k closest photo(s). k=',
    '<select id="k">',
    '</select>',
    '<div>',
      getHtml(photos),
    '</div>',
    '<h2>',
      'End of Album: ' + albumName,
    '</h2>',
    '<div>',
      '<button onclick="listAlbums()">',
        'Back To Albums',
      '</button>',
    '</div>',
  ]
  document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
  for(var i=1; i<=10; i++){
    var select = document.getElementById("k");
    var option = document.createElement("OPTION");
    select.options.add(option);
    option.text = i;
    option.value = i;
  }
  var select = document.getElementById("k");
  var button = document.querySelectorAll(".search");
  button.forEach(item => item.addEventListener("click", () => { //console.log(item.type); 
                                                                  viewClosest(item.name, select.value, albumName); }));
  })
  });
}
// snippet-end:[s3.JavaScript.s3_PhotoViewer.viewAlbum]
// snippet-end:[s3.JavaScript.s3_PhotoViewer.complete]
