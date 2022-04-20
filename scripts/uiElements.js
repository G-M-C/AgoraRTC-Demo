// UI Elements - jQuery
function enableUiControls(localStream) {

    $("#mic-btn").prop("disabled", false);
    $("#video-btn").prop("disabled", false);
    $("#screen-share-btn").prop("disabled", false);
    $("#exit-btn").prop("disabled", false);
  
    $("#mic-btn").click(function(){
      toggleMic(localStream);
    });
  
    $("#video-btn").click(function(){
      toggleVideo(localStream);
    });
  
    $("#screen-share-btn").click(function(){
      toggleScreenShareBtn(); 
      $("#screen-share-btn").prop("disabled",true);
       if(screenShareActive){
        stopScreenShare();
      } else {
        initScreenShare(); 
       }
    });
  
    $("#exit-btn").click(function(){
      console.log("Bye");
      leaveChannel(); 
    });
  
  function toggleBtn(btn){
    btn.toggleClass('btn-dark').toggleClass('btn-danger');
  }
  
  function toggleScreenShareBtn(){
    $('#screen-share-btn').toggleClass('btn-danger');
    //$('#screen-share-icon').toggleClass('fa-share-square').toggleClass('fa-times-circle');
  }
  
  function toggleVisibility(elementID, visible){
    if (visible) {
      $(elementID).attr("style", "display:block");
    } else {
      $(elementID).attr("style", "display:none");
    }
  }
  
  function toggleMic(localStream) {
    toggleBtn($("#mic-btn")); 
    $("#mic-icon").toggleClass('fa-microphone').toggleClass('fa-microphone-slash'); 
    if ($("#mic-icon").hasClass('fa-microphone')) {
      localStream.unmuteAudio(); 
      toggleVisibility("#mute-overlay", false); 
    } else {
      localStream.muteAudio(); 
      toggleVisibility("#mute-overlay", true);
    }
  }
  
  function toggleVideo(localStream) {
    toggleBtn($("#video-btn")); 
    $("#video-icon").toggleClass('fa-video').toggleClass('fa-video-slash'); 
    if ($("#video-icon").hasClass('fa-video')) {
      localStream.unmuteVideo(); 
      toggleVisibility("#no-local-video", false); 
    } else {
      localStream.muteVideo();
      toggleVisibility("#no-local-video", true);
    }
  }
}