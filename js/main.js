/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

var gumVideo = document.querySelector('video#gum');
var recordedVideo = document.querySelector('video#recorded');

var recordButton = document.querySelector('button#record');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
var uploadButton = document.querySelector('button#upload');
var uploadToken = null;
recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;
uploadButton.onclick = upload;

// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === 'https:' ||
location.hostname === 'localhost';
/*if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
    '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}*/

var constraints = {
  audio: true,
  video: true
};

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream: ', stream);
  window.stream = stream;
  if (window.URL) {
    gumVideo.src = window.URL.createObjectURL(stream);
  } else {
    gumVideo.src = stream;
  }
}

function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

recordedVideo.addEventListener('error', function(ev) {
  console.error('MediaRecording.recordedMedia.error()');
  alert('Your browser can not play\n\n' + recordedVideo.src
    + '\n\n media clip. event: ' + JSON.stringify(ev));
}, true);

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
    uploadButton.disabled = false;
  }
}

function startRecording() {
  recordedBlobs = [];
  var options = {mimeType: 'video/webm;codecs=vp9'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log(options.mimeType + ' is not Supported');
    options = {mimeType: 'video/webm;codecs=vp8'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: ''};
      }
    }
  }
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ' + e);
    alert('Exception while creating MediaRecorder: '
      + e + '. mimeType: ' + options.mimeType);
    return;
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  uploadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  recordedVideo.controls = true;
}

function play() {
  var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
}

function download() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = document.getElementById('entryName').value + '.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function genKS(server,userId, password, partnerId)
{
    var params;
    if (partnerId){
	params="format=1&loginId="+encodeURIComponent(userId)+"&password="+encodeURIComponent(password)+"&partnerId="+encodeURIComponent(partnerId);
    }else{
	params="format=1&loginId="+encodeURIComponent(userId)+"&password="+encodeURIComponent(password);
    }
    kDoJSONApiRequest(server+"/service/user/action/loginByLoginId?"+params, 
	null, function(ks) {
	    if (!ks){
		console.log('error generating KS');
		return false;
	    }
	document.getElementById("inputKS").value=ks;
    });
}    
function kDoJSONApiRequest(endpoint, data, callback) {
    
    var xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.responseType = "json";
    xhr.onload = function(event) {
	callback(event.target.response);
    };
    xhr.send(data);
}

function upload() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
    var kaltEndpoint = document.getElementById("serviceUrl").value + '/api_v3/';
    var ks=document.getElementById("inputKS").value;
    var fileType = 'video'; // or "audio"
    var fileName = document.getElementById('entryName').value + '.webm'; // or "wav"
    var formData = new FormData();
    formData.append(fileType + '-filename', fileName);
    formData.append('fileData', blob);
    formData.append('uploadToken:objectType', 'KalturaUploadToken');
    formData.append('uploadToken:fileName',encodeURIComponent(fileName));
    formData.append('ks', ks);
    formData.append('format', 1);
    kDoJSONApiRequest(kaltEndpoint+'/service/uploadToken/action/add',formData, 
                function (myuploadToken) {
		uploadToken=myuploadToken.id;
    		formData = new FormData();
	    	formData.append('fileData', blob);
	    	formData.append('uploadTokenId', uploadToken);
	    	formData.append('resume',false);
	    	formData.append('resumeAt',false);
	    	formData.append('finalChunk',true);
	    	formData.append('ks', ks);
		formData.append('format', 1);
			kDoJSONApiRequest(kaltEndpoint+'/service/uploadToken/action/upload', formData,
				function (response) {
					kDoJSONApiRequest(kaltEndpoint+'/service/media/action/addFromUploadedFile?'+ 
						"ks=" + ks +
						"&format=1" +
						"&mediaEntry:name="+fileName +
						"&mediaEntry:mediaType=1" +
						"&uploadTokenId="+uploadToken, null
						,function (response) {
							console.log("addFromUploadedFile:");
							console.log(response);
					});
			});
	});

}
