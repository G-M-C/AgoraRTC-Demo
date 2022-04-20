//Agora functions and listeners

// Settings for video profile
var cameraVideoProfile = '480p_4'; 
var screenVideoProfile = '480p_2'; 

// Agora Details
var agoraAppId = "aa9b31bd8bd747bca81627001fe3b1b2"
var channelName = "Demo2"
var token = "006aa9b31bd8bd747bca81627001fe3b1b2IACCVlSImboXz5AjNfgCeQvxlSXeVVsME8NgwoMkZZD32D5wFA0AAAAAEACKbcvBLF9hYgEAAQArX2Fi"

// Client vars for rtc and screen-share
var client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'}); 
var screenClient;

// stream references (keep track of active streams) 
var remoteStreams = {}; // remote streams obj struct [id : stream] 

var localStreams = {
  rtc: {
    id: "",
    stream: {}
  },
  screen: {
    id: "",
    stream: {}
  }
};

// reference to main stream
var mainStreamId; 
// flag to check screen-share status
var screenShareActive = false; 

function initClientAndJoinChannel(uid) {
  // To init and setup Agora SDK
  client.init(agoraAppId, function () {
    console.log("AgoraRTC client initialized");
    // Joins channel if Agora has been successfully initialized
    joinChannel(channelName, uid, token); 
  }, function (err) {
    console.log("[ERROR] : AgoraRTC client initialization failed", err);
  });
}


client.on('stream-published', function (evt) {
  console.log("Local stream has been published succesfully");
});

// To connect to remote streams
client.on('stream-added', function (evt) {
  var stream = evt.stream;
  var streamId = stream.getId();
  console.log("new stream added: " + streamId);
  // Check if the stream is local
  if (streamId != localStreams.screen.id) {
    console.log('subscribe to remote stream:' + streamId);
    // Subscribe to the stream.
    client.subscribe(stream, function (err) {
      console.log("[ERROR] : Failed to subscribe to stream", err);
    });
  }
});

client.on('stream-subscribed', function (evt) {
    var remoteStream = evt.stream;
    var remoteId = remoteStream.getId();
    remoteStreams[remoteId] = remoteStream;
    console.log("Subscribe remote stream successfully: " + remoteId);
    if( $('#full-screen-video').is(':empty') ) { 
      mainStreamId = remoteId;
      remoteStream.play('full-screen-video');
    } else if (remoteId == 66666) {
        // move the current main stream to miniview
        remoteStreams[mainStreamId].stop(); 
        client.setRemoteVideoStreamType(remoteStreams[mainStreamId], 1); 
        addRemoteStreamMiniView(remoteStreams[mainStreamId]); 
        // set the screen-share as the main 
        mainStreamId = remoteId;
        remoteStream.play('full-screen-video');s
    } else {
      client.setRemoteVideoStreamType(remoteStream, 1);
      addRemoteStreamMiniView(remoteStream);
    }
  });

// To remove the remote-container when a user leaves the channel
client.on("peer-leave", function(evt) {
  var streamId = evt.stream.getId(); 
  if(remoteStreams[streamId] != undefined) {
    remoteStreams[streamId].stop(); // stop playing the feed
    delete remoteStreams[streamId]; // remove stream from list
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

// show mute icon whenever a remote has muted their mic
client.on("mute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', true);
});

client.on("unmute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', false);
});

// show user icon whenever a remote has disabled their video
client.on("mute-video", function (evt) {
  var remoteId = evt.uid;
  // if the main user stops their video select a random user from the list
  if (remoteId != mainStreamId) {
    // if not the main vidiel then show the user icon
    toggleVisibility('#' + remoteId + '_no-video', true);
  }
});

client.on("unmute-video", function (evt) {
  toggleVisibility('#' + evt.uid + '_no-video', false);
});

//To join a channel
function joinChannel(channelName, uid, token) {
  client.join(token, channelName, uid, function(uid) {
      console.log("User " + uid + " joined channel successfully");
      createStream(uid);
      localStreams.rtc.id = uid; // To keep track of the rtc-stream uid
  }, function(err) {
      console.log("[ERROR] : Failed to join channel", err);
  });
}

// Creates streams for the channel
function createStream(uid) {
  var localStream = AgoraRTC.createStream({
    streamID: uid,
    audio: true,
    video: true,
    screen: false
  });
  localStream.setVideoProfile(cameraVideoProfile);
  localStream.init(function() {
    console.log("Obtained user media successfully");
    if (Object.keys(remoteStreams).length == 0) {

        localStream.play('full-screen-video');
    }else{
    localStream.play('local-video');
    } 

    // publish local stream
    client.publish(localStream, function (err) {
      console.log("[ERROR] : publish local stream error: " + err);
    });
  
    enableUiControls(localStream);
    // Keeps track of rtc stream for later
    localStreams.rtc.stream = localStream; 
  }, function (err) {
    console.log("[ERROR] : Failed to get user media", err);
  });
}

// ALL THINGS RELATED TO SCREEN-SHARING BELOW


function initScreenShare() {
  // Screen-Stream uid harcoded for now for easier identification.
  var uid = 66666; 
  screenClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'}); 
  screenClient.init(agoraAppId, function () {
    console.log("AgoraRTC screenClient initialized");
  }, function (err) {
    console.log("[ERROR] : AgoraRTC screenClient init failed", err);
  });
  // keep track of the uid of the screen stream. 
  localStreams.screen.id = uid;  
  
  // Create the stream for screen sharing.
  var screenStream = AgoraRTC.createStream({
    streamID: uid,
    audio: false, 
    video: false,
    screen: true, // screen stream
    screenAudio: true,
    //extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg', // Google Chrome (special extnsn required for Chrome):
    mediaSource:  'screen', //  for Firefox: 'screen', 'application', 'window' (select one)
  });
  // Initialize the stream 
  screenStream.init(function(){
    console.log("Screen obtained");
    //To keep track of the screen stream
    localStreams.screen.stream = screenStream; 
    screenShareActive = true;
    // Enable screen-share button
    $("#screen-share-btn").prop("disabled",false);
    screenClient.join(token, channelName, uid, function(uid) { 
      screenClient.publish(screenStream, function (err) {
        console.log("[ERROR] : Failed to publish screen-stream: " + err);
      });
    }, function(err) {
      console.log("[ERROR] : Screen-stream couldn't join channel", err);
    });
  }, function (err) {
    console.log("[ERROR] : Failed to obtain screen", err);
    localStreams.screen.id = "";
    localStreams.screen.stream = {};
    screenShareActive = false;
    // Toggle Screen Share button
    toggleScreenShareBtn();
    // Enable screen-share button
    $("#screen-share-btn").prop("disabled",false);
  });
  screenClient.on('stream-published', function (evt) {
    console.log("Published Screen-Stream successfully");
    if( $('#full-screen-video').is(':empty') == false ) { 
      // Current Mainstream should be sent to Smaller Container (mini-view)
      remoteStreams[mainStreamId].stop();
      client.setRemoteVideoStreamType(remoteStreams[mainStreamId], 1);
      addRemoteStreamMiniView(remoteStreams[mainStreamId]);
    }
    mainStreamId = localStreams.screen.id;
    localStreams.screen.stream.play('full-screen-video');
  });
  
  screenClient.on('stopScreenSharing', function (evt) {
    console.log("screen sharing stopped", err);
  }); 
}

function stopScreenShare() {
  localStreams.screen.stream.disableVideo(); 
  localStreams.screen.stream.stop();
//   localStreams.rtc.stream.enableVideo();
//   localStreams.rtc.stream.play('local-video'); 
//   $("#video-btn").prop("disabled",false);
  screenClient.leave(function() {
    screenShareActive = false; 
    console.log("Screen client has left the channel");
    $("#screen-share-btn").prop("disabled",false); // enable button
    screenClient.unpublish(localStreams.screen.stream); // unpublish the screen client
    localStreams.screen.stream.close(); // close the screen client stream
    localStreams.screen.id = ""; // reset the screen id
    localStreams.screen.stream = {}; // reset the stream obj
  }, function(err) {
    console.log("client leave failed ", err); //error handling
  }); 
}

// EVERYTHING RELATED TO REMOTE STREAMS BELOW
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
    localStreams.rtc.stream.stop() 
    client.unpublish(localStreams.rtc.stream); 
    localStreams.rtc.stream.close(); 
    $("#remote-streams").empty()
    //disable the UI elements
    $("#mic-btn").prop("disabled", true);
    $("#video-btn").prop("disabled", true);
    $("#screen-share-btn").prop("disabled", true);
    $("#exit-btn").prop("disabled", true);
    // hide the mute/no-video overlays
    toggleVisibility("#mute-overlay", false); 
    toggleVisibility("#no-local-video", false);
  }, function(err) {
    console.log("Client failed to leave ", err); //error handling
  });
}

//  !PENDING : Function to generate token
function generateToken() {
  return null; 
}