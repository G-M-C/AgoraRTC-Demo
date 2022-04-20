// Init with app-id and channel seetings
var agoraAppId = ""; // Set your Agora App ID
var channelName = 'Demo1';

// video profile settings
// To know more about video profiles :  https://docs.agora.io/en/Video/video_profile_web?platform=Web
var cameraVideoProfile = '480p_4';
var screenVideoProfile = '480p_2';

// Create 2 instances for camera(client) and screen(screenClient)
var client = AgoraRTC.createClient({mode: 'rtc', codec: "vp8"}); 
var screenClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'}); 

// Stream references to help keep track of Active Streams
var remoteStreams = {};

var localStreams = {
  camera: {
    id: "",
    stream: {}
  },
  screen: {
    id: "",
    stream: {}
  }
};

// Setting a reference to the main stream
var mainStreamId; 
// Setting a flag for screen share (false by default)
var screenShareActive = false; 

// init Agora SDK
client.init(agoraAppId, function () {
  console.log("AgoraRTC client initialized");
  joinChannel(); // joins channel upon successfull init
}, function (err) {
  console.log("[ERROR] : AgoraRTC client init failed", err);
});

client.on('stream-published', function (evt) {
  console.log("Publish local stream successfully");
});

//To connect remote streams
client.on('stream-added', function (evt) {
  var stream = evt.stream;
  var streamId = stream.getId();
  console.log("new stream added: " + streamId);
  // Check if the stream is local
  if (streamId != localStreams.screen.id) {
    console.log('subscribe to remote stream:' + streamId);
    // Subscribe to the stream.
    client.subscribe(stream, function (err) {
      console.log("[ERROR] : subscribe stream failed", err);
    });
  }
});

client.on('stream-subscribed', function (evt) {
  var remoteStream = evt.stream;
  var remoteId = remoteStream.getId();
  remoteStreams[remoteId] = remoteStream;
  console.log("Subscribe remote stream successfully: " + remoteId);
  console.log(remoteStreams);
  if( $('#full-screen-video').is(':empty') ) { 
    mainStreamId = remoteId;
    remoteStream.play('full-screen-video');
  } else {
    addRemoteStreamMiniView(remoteStream);
  }
});

//To remove the remote-container when a user leaves the channel
client.on("peer-leave", function(evt) {
  // Gets the stream id
  var streamId = evt.stream.getId(); 
  if(remoteStreams[streamId] != undefined) {
    // Stops playing the feed
    remoteStreams[streamId].stop();
    // removes streams from the list
    delete remoteStreams[streamId];
    if (streamId == mainStreamId) {
      // Course of action when the main stream is the one leaving the channel.
      var streamIds = Object.keys(remoteStreams);
      // Choose another stream as the main stream.
      var randomId = streamIds[Math.floor(Math.random()*streamIds.length)];
      // Temporarily stop stream-designate's playback
      remoteStreams[randomId].stop();
      var remoteContainerID = '#' + randomId + '_container';
      // Remove stream-designate's stream  from mini-view
      $(remoteContainerID).empty().remove();
      // Play in full view and set stream-designate as main stream
      remoteStreams[randomId].play('full-screen-video'); 
      mainStreamId = randomId;
    // Course of action when a non-main stream is leaving the channel.
    } else {
      var remoteContainerID = '#' + streamId + '_container';
      $(remoteContainerID).empty().remove(); // 
    }
  }
});

//To show mute icon whenever a remote has muted their mic
client.on("mute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', true);
});
//To hide mute icon whenever a remote has unmuted their mic
client.on("unmute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', false);
});

//To show user icon whenever a remote has disabled their video
client.on("mute-video", function (evt) {
  var remoteId = evt.uid;
  // if the main user stops their video select a random user from the list
  if (remoteId != mainStreamId) {
    // if not the main video then show the user icon
    toggleVisibility('#' + remoteId + '_no-video', true);
  }
});

client.on("unmute-video", function (evt) {
  toggleVisibility('#' + evt.uid + '_no-video', false);
});

//Joining a channel
function joinChannel() {
  var token = generateToken();
  var userID = null; // set to null to auto generate uid on successfull connection
  client.join(token, channelName, userID, function(uid) {
      console.log("User " + uid + " join channel successfully");
      createCameraStream(uid);
      localStreams.camera.id = uid; // keep track of the stream uid 
  }, function(err) {
      console.log("[ERROR] : join channel failed", err);
  });
}

//Creating Video streams for channel.
function createCameraStream(uid) {
  var localStream = AgoraRTC.createStream({
    streamID: uid,
    audio: true,
    video: true,
    screen: false
  });
  localStream.setVideoProfile(cameraVideoProfile);
  localStream.init(function() {
    console.log("got User Media successfully");
    // play the given stream within the local-video div
    localStream.play('local-video');

    // publish local stream
    client.publish(localStream, function (err) {
      console.log("[ERROR] : publish local stream error: " + err);
    });
  
    enableUiControls(localStream); 
    // Keeps track of camera stream
    localStreams.camera.stream = localStream;
  }, function (err) {
    console.log("[ERROR] : getUserMedia failed", err);
  });
}

// SCREEN SHARING
function initScreenShare() {
  screenClient.init(agoraAppId, function () {
    console.log("AgoraRTC screenClient initialized");
    joinChannelAsScreenShare();
    screenShareActive = true;
  }, function (err) {
    console.log("[ERROR] : AgoraRTC screenClient init failed", err);
  });  
}

function joinChannelAsScreenShare() {
  var token = generateToken();
  var userID = null; // set to null to auto generate uid on successfull connection
  screenClient.join(token, channelName, userID, function(uid) { 
    localStreams.screen.id = uid;  // keep track of the uid of the screen stream.
    
    // Create the stream for screen sharing.
    var screenStream = AgoraRTC.createStream({
      streamID: uid,
      audio: false,
      video: false,
      screen: true, // Enable Screen
      extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg', // Google Chrome (special extnsn required for Chrome):
      mediaSource:  'screen', // Firefox: 'screen', 'application', 'window' (select one)
    });
    screenStream.setScreenProfile(screenVideoProfile); // set the profile of the screen
    screenStream.init(function(){
      console.log("getScreen successful");
      //To keep track of the screen stream.
      localStreams.screen.stream = screenStream;
      //enables screen share button
      $("#screen-share-button").prop("disabled",false);
      screenClient.publish(screenStream, function (err) {
        console.log("[ERROR] : publish screen stream error: " + err);
      });
    }, function (err) {
      console.log("[ERROR] : getScreen failed", err);
      // Reset all screen share related params incase of failure.
      localStreams.screen.id = ""; 
      localStreams.screen.stream = {};
      screenShareActive = false; 
      toggleScreenShareButton();
    });
  }, function(err) {
    console.log("[ERROR] : join channel as screen-share failed", err);
  });

  screenClient.on('stream-published', function (evt) {
    console.log("Publish screen stream successfully");
    localStreams.camera.stream.disableVideo(); // disable the local video stream (will send a mute signal)
    localStreams.camera.stream.stop(); // stop playing the local stream
    remoteStreams[mainStreamId].stop(); // stop the main video stream playback
    // Send main stream to remote container to have screen capture in full screen.
    addRemoteStreamMiniView(remoteStreams[mainStreamId]); 
    // disable the video button (as cameara video stream is disabled)
    $("#video-button").prop("disabled",true); 
  });
  
  screenClient.on('stopScreenSharing', function (evt) {
    console.log("screen sharing stopped", err);
  });
}

function stopScreenShare() {
  localStreams.screen.stream.disableVideo(); // disable the local video stream (will send a mute signal)
  localStreams.screen.stream.stop(); // stop playing the local stream
  localStreams.camera.stream.enableVideo(); // enable the camera feed
  localStreams.camera.stream.play('local-video'); // play the camera within the full-screen-video div
  $("#video-button").prop("disabled",false);
  screenClient.leave(function() {
    screenShareActive = false; 
    console.log("screen client leaves channel");
    $("#screen-share-button").prop("disabled",false); // enable button
    screenClient.unpublish(localStreams.screen.stream); // unpublish the screen client
    localStreams.screen.stream.close(); // close the screen client stream
    localStreams.screen.id = ""; // reset the screen id
    localStreams.screen.stream = {}; // reset the stream object
  }, function(err) {
    console.log("client leave failed ", err);
  }); 
}

// REMOTE STREAMS UI
function addRemoteStreamMiniView(remoteStream){
  var streamId = remoteStream.getId();
  // append the remote stream template to #remote-streams
  $('#remote-streams').append(
    $('<div/>', {'id': streamId + '_container',  'class': 'remote-stream-container col'}).append(
      $('<div/>', {'id': streamId + '_mute', 'class': 'mute-overlay'}).append(
          $('<i/>', {'class': 'fas fa-microphone-slash'})
      ),
      $('<div/>', {'id': streamId + '_no-video', 'class': 'no-video-overlay text-center'}).append(
        $('<i/>', {'class': 'fas fa-user'})
      ),
      $('<div/>', {'id': 'agora_remote_' + streamId, 'class': 'remote-video'})
    )
  );
  remoteStream.play('agora_remote_' + streamId); 

  var containerId = '#' + streamId + '_container';
  $(containerId).dblclick(function() {
    // play selected container as full screen - swap out current full screen stream
    remoteStreams[mainStreamId].stop(); // stop the main video stream playback
    addRemoteStreamMiniView(remoteStreams[mainStreamId]); // send the main video stream to a container
    $(containerId).empty().remove(); // remove the stream's miniView container
    remoteStreams[streamId].stop() // stop the container's video stream playback
    remoteStreams[streamId].play('full-screen-video'); // play the remote stream as the full screen video
    mainStreamId = streamId; // set the container stream id as the new main stream id
  });
}

function leaveChannel() {
  
  if(screenShareActive) {
    stopScreenShare();
  }

  client.leave(function() {
    console.log("client leaves channel");
    localStreams.camera.stream.stop() // stop the camera stream playback
    client.unpublish(localStreams.camera.stream); // unpublish the camera stream
    localStreams.camera.stream.close(); // clean up and close the camera stream
    $("#remote-streams").empty() // clean up the remote feeds
    //disable the UI elements
    $("#mic-button").prop("disabled", true);
    $("#video-button").prop("disabled", true);
    $("#screen-share-button").prop("disabled", true);
    $("#exit-button").prop("disabled", true);
    // hide the mute/no-video overlays
    toggleVisibility("#mute-overlay", false); 
    toggleVisibility("#no-local-video", false); 
  }, function(err) {
    console.log("client leave failed ", err); //error handling
  });
}

// Generates a token for security
// NEED TO AUTOMATE THIS (Agora token server setup)
function generateToken() {
  return ""
}