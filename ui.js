//creaate a method which enables the ui controls and toggles them.
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
    toggleScreenShareBtn(); // set screen share button icon
    $("#screen-share-btn").prop("disabled",true); // disable the button on click
    if(myScreenShareActive){
      stopScreenShare();
    } else {
      var agoraAppId = "c52eafb36b1642eab50b88c3fefbd26a";
      var channelName = "myChannel1";
      var uid = $("#form-uid").val();
      initScreenShare(null, agoraAppId, channelName, null);
    }
  });
// Query the container to which the screen-share-container belongs.
const elem = document.querySelector('#screen-share-container');

//add an event listener to the screen share element.
elem.addEventListener("click", function(e) {
  toggleFullScreen();
}, false);

function toggleFullScreen() {

  if (!document.fullscreenElement) {
    elem.requestFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
  }
}

  $("#exit-btn").click(function(){
    alert("So sad to see you leave the room!");
    leaveChannel();
  });
}
function toggleBtn(btn){
  btn.toggleClass('btn-dark').toggleClass('btn-danger');
}

function toggleVisibility(elementID, visible) {
  if (visible) {
    $(elementID).attr("style", "display:block");
  } else {
    $(elementID).attr("style", "display:none");
  }
}

function toggleScreenShareBtn() {
  $('#screen-share-btn').toggleClass('btn-danger');
  $('#screen-share-icon').toggleClass('fa-share-square').toggleClass('fa-times-circle');
}


function toggleMic(localStream) {
toggleBtn($("#mic-btn")); // toggle button colors
$("#mic-icon").toggleClass('fa-microphone').toggleClass('fa-microphone-slash'); // toggle the mic icon
if ($("#mic-icon").hasClass('fa-microphone')) {
  localStream.enableAudio(); // enable the local mic
  toggleVisibility("#mute-overlay", false); // hide the muted mic icon
} else {
  localStream.disableAudio(); // mute the local mic
  toggleVisibility("#mute-overlay", true); // show the muted mic icon
}
}

function toggleVideo(localStream) {
  toggleBtn($("#video-btn")); // toggle button colors
  $("#video-icon").toggleClass('fa-video').toggleClass('fa-video-slash'); // toggle the video icon
  if ($("#video-icon").hasClass('fa-video')) {
    localStream.enableVideo(); // enable the local video
    toggleVisibility("#no-local-video", false); // hide the user icon when video is enabled
  } else {
    localStream.disableVideo(); // disable the local video
    toggleVisibility("#no-local-video", true); // show the user icon when video is disabled
  }
}
function closeLocalStream(booleanValue){
  return booleanValue;
}
