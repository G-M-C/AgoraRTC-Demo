// Buttons for UI control
function enableUiControls(localStream) {

    $("#mic-button").prop("disabled", false);
    $("#video-button").prop("disabled", false);
    $("#screen-share-button").prop("disabled", false);
    $("#exit-button").prop("disabled", false);
  
    $("#mic-button").click(function(){
      toggleMic(localStream);
    });
  
    $("#video-button").click(function(){
      toggleVideo(localStream);
    });
  
    $("#screen-share-button").click(function(){
      toggleScreenShareButton(); // set screen share button icon
      $("#screen-share-button").prop("disabled",true); // disable the button on click
      if(screenShareActive){
        stopScreenShare();
      } else {
        initScreenShare(); 
      }
    });
  
    $("#exit-button").click(function(){
      console.log("Bye Bye !");
      leaveChannel(); 
    });
  
    // keyboard listeners 
    $(document).keypress(function(e) {
      switch (e.key) {
        case "m":
          console.log("Mic toggled on pressing m");
          toggleMic(localStream);
          break;
        case "v":
          console.log("Video toggled on pressing v");
          toggleVideo(localStream);
          break; 
        case "s":
          console.log("Screenshare toggled on pressing s");
          toggleScreenShareButton(); // set screen share button icon
          $("#screen-share-button").prop("disabled",true); // disable the button on click
          if(screenShareActive){
            stopScreenShare();
          } else {
            initScreenShare(); 
          }
          break;  
        case "q":
          console.log("Bye Bye");
          leaveChannel(); 
          break;   
        default: 
          // nothing
      }
  
    /*  // (for testing) 
      if(e.key === "r") { 
        window.history.back(); 
        // quick reset
      } 
      */
    });
  }
  
  function toggleButton(button){
    button.toggleClass('btn-dark').toggleClass('btn-danger');
  }
  
  function toggleScreenShareButton() {
    $('#screen-share-btn').toggleClass('btn-danger');
    $('#screen-share-icon').toggleClass('fa-share-square').toggleClass('fa-times-circle');
  }
  
  function toggleVisibility(elementID, visible) {
    if (visible) {
      $(elementID).attr("style", "display:block");
    } else {
      $(elementID).attr("style", "display:none");
    }
  }
  
  function toggleMic(localStream) {
    toggleButton($("#mic-button")); // toggle button colors
    $("#mic-icon").toggleClass('fa-microphone').toggleClass('fa-microphone-slash'); // toggle the mic icon
    if ($("#mic-icon").hasClass('fa-microphone')) {
      localStream.unmuteAudio(); // enable the local mic
      toggleVisibility("#mute-overlay", false); // hide the muted mic icon
    } else {
      localStream.muteAudio(); // mute the local mic
      toggleVisibility("#mute-overlay", true); // show the muted mic icon
    }
  }
  
  function toggleVideo(localStream) {
    toggleButton($("#video-button")); // toggle button colors
    $("#video-icon").toggleClass('fa-video').toggleClass('fa-video-slash'); // toggle the video icon
    if ($("#video-icon").hasClass('fa-video')) {
      localStream.unmuteVideo(); // enable the local video
      toggleVisibility("#no-local-video", false); // hide the user icon when video is enabled
    } else {
      localStream.muteVideo(); // disable the local video
      toggleVisibility("#no-local-video", true); // show the user icon when video is disabled
    }
  }