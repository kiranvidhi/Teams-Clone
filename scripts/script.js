
var screenVideoProfile = '480p_1';

// Handle errors.
let handleError = function(err){
        console.log("Error: ", err);
};

// Query the container to which the remote stream belong.
let remoteContainer = document.getElementById("remote-container");

// Query the container to which the screen stream belong.
let screenContainer = document.getElementById("screen-share-container");

// Add video streams to the container.
function addVideoStream(elementId){
        // Creates a new div for every stream
        let streamDiv = document.createElement("div");
        // Assigns the elementId to the div.
        streamDiv.id = elementId;
        // Takes care of the lateral inversion
        streamDiv.style.transform = "rotateY(180deg)";
        // Adds the div to the container.
        remoteContainer.appendChild(streamDiv);
};

function addScreenStream(elementId){
        // Creates a new div for every stream
        let streamDiv = document.createElement("div");
        // Assigns the elementId to the div.
        streamDiv.id = elementId;
        // Adds the div to the container.
        screenContainer.appendChild(streamDiv);
        console.log("Hello, I am in add screen str");
};

// Remove the video stream from the container.
function removeVideoStream(elementId) {
        let remoteDiv = document.getElementById(elementId);
        if (remoteDiv) remoteDiv.parentNode.removeChild(remoteDiv);
};

//create the client
let client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
});

//create the screen client
var screenClient = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

//Initialize the local streams
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

//Initialize the remote streams
var remoteStreams = {};

var mainStreamId;
var myScreenShareActive = false; // flag for screen share

var otherScreenShareActive = false;

// show mute icon whenever a remote has muted their mic
client.on("mute-audio", function (evt) {
  toggleVisibility('#' + evt.uid + '_mute', true);
});
// show unmute icon whenever a remote has muted their mic
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
// show user icon whenever a remote has enabled their video
client.on("unmute-video", function (evt) {
  toggleVisibility('#' + evt.uid + '_no-video', false);
});

//create a function to initialize the client
 function clientInit(){
   client.init("c52eafb36b1642eab50b88c3fefbd26a", function() {
       console.log("client initialized");
   }, function(err) {
       console.log("client init failed ", err);
   });
 }

function joinChannel(uid){
// Join a channel
client.join(null, "myChannel1", null, (uid)=>{
  // Create a local stream
      let localStream = AgoraRTC.createStream({
      audio: true,
      video: true,
  });



  // Initialize the local stream
  localStream.init(()=>{
      // Play the local stream
      console.log("initializibg local stream");
      localStream.play("me");
      // Publish the local stream
      client.publish(localStream, handleError);
      enableUiControls(localStream);
      localStreams.camera.stream = localStream;
      localStreams.camera.id = uid;
  }, handleError);
}, handleError);

}

//Publish the remote stream
client.on('stream-published', function (evt) {
  console.log("Publish local stream successfully");
});

// Subscribe to the remote stream when it is published
client.on("stream-added", function(evt){
    client.subscribe(evt.stream, handleError);
});
// Play the remote stream when it is subsribed
client.on("stream-subscribed", function(evt){
  let stream = evt.stream;
  let streamId = String(stream.getId());
  remoteStreams[streamId] = stream;

  //subscribe to the screen-share container if someone has already shared the screen otherwise subscribe to the remote container
  if(myScreenShareActive || otherScreenShareActive){
    console.log("Subscribe screen stream successfully: " + streamId);
    mainStreamId = streamId;
    addScreenStream(streamId);
    stream.play(streamId);
  }else{
    console.log("Subscribe remote stream successfully: " + streamId);
    mainStreamId = streamId;
    addVideoStream(streamId);
    stream.play(streamId);
  }
});

// Remove the corresponding view when a remote user unpublishes.
client.on("stream-removed", function(evt){
    let stream = evt.stream;
    let streamId = String(stream.getId());
    stream.close();
    removeVideoStream(streamId);
});
// Remove the corresponding view when a remote user leaves the channel.
client.on("peer-leave", function(evt){
    let stream = evt.stream;
    let streamId = String(stream.getId());
    stream.close();
    removeVideoStream(streamId);
});

// SCREEN SHARING
//Initilize the screen client
function initScreenShare(token,agoraAppId, channelName, uid) {
  screenClient.init(agoraAppId, function () {
    console.log("AgoraRTC screenClient initialized");
    myScreenShareActive = true;
    sendScreenShareMessage("remote user has shared screen");
    joinChannelAsScreenShare(channelName, uid, token);
    // TODO: add logic to swap button
  }, function (err) {
    console.log("[ERROR] : AgoraRTC screenClient init failed", err);
  });
}

//create a method for the screen client to join the channel
function joinChannelAsScreenShare(channelName, uid, token) {

  screenClient.join(token, channelName, uid, function(uid) {
   console.log(uid);
     localStreams.screen.id = uid;  // keep track of the uid of the screen stream.
    // Create the stream for screen sharing.
    var screenStream = AgoraRTC.createStream({
      streamID: uid,
      audio: false, // Set the audio attribute as false to avoid any echo during the call.
      video: false,
      screen: true, // screen stream
      mediaSource:  'screen', // Firefox: 'screen', 'application', 'window' (select one)\
      mirror: false,
    });
    screenStream.cameraId=1001;
    screenStream.setScreenProfile(screenVideoProfile); // set the profile of the screen
    screenStream.init(function(){
      console.log("getScreen successful");
      addScreenStream(String(screenStream.getId()));
      localStreams.screen.stream = screenStream; // keep track of the screen stream
      $("#screen-share-btn").prop("disabled",false); // enable button
      screenClient.publish(screenStream, function (err) {
        console.log("[ERROR] : publish screen stream error: " + err);
      });
    }, function (err) {
      console.log("[ERROR] : getScreen failed", err);
      localStreams.screen.id = ""; // reset screen stream id
      localStreams.screen.stream = {}; // reset the screen stream
      myScreenShareActive = false; // resest screenShare
      toggleScreenShareBtn(); // toggle the button icon back (will appear disabled)
    });
  }, function(err) {
    console.log("[ERROR] : join channel as screen-share failed", err);
  });

  //publish the screen client
  screenClient.on('stream-published', function (evt) {
    console.log("Publish screen stream successfully");
  });

 //When the screensharing stops
  screenClient.on('stopScreenSharing', function (evt) {
    localStreams.camera.stream.enableVideo();
    remoteStreams[mainStreamId].enableVideo();
    console.log("screen sharing stopped", err);
  });
}

//create a function to stop the screen sharing
function stopScreenShare() {
  localStreams.screen.stream.disableVideo(); // disable the local video stream (will send a mute signal)
  localStreams.screen.stream.stop(); // stop playing the local stream
  localStreams.camera.stream.enableVideo(); // enable the camera feed
  localStreams.camera.stream.play('me'); // play the camera within the full-screen-video div
  $("#video-btn").prop("disabled",false);
  screenClient.leave(function() {
    myScreenShareActive = false;
    sendScreenShareMessage("remote user has stopped sharing screen");
    console.log("screen client leaves channel");
    $("#screen-share-btn").prop("disabled",false); // enable button
    screenClient.unpublish(localStreams.screen.stream); // unpublish the screen client
    localStreams.screen.stream.close(); // close the screen client stream
    localStreams.screen.id = ""; // reset the screen id
    localStreams.screen.stream = {}; // reset the stream obj
  }, function(err) {
    console.log("client leave failed ", err); //error handling
  });
}

//create a function which runs when the client leaves the channel
function leaveChannel() {

  client.leave(function() {
    console.log("client leaves channel");
    localStreams.camera.stream.stop() // stop the camera stream playback
    client.unpublish(localStreams.camera.stream); // unpublish the camera stream
    localStreams.camera.stream.close(); // clean up and close the camera stream
    closeLocalStream(true);
    enableUiControls(localStreams.camera.stream);
    $("#remote-container").empty() // clean up the remote feeds
    //disable the UI elements
    $("#exit-btn").prop("disabled", true);
    $("#mic-btn").prop("disabled", true);
    $("#video-btn").prop("disabled", true);
    // hide the mute/no-video overlays
    document.getElementById("Video call").style.display="none";
    document.getElementById("vc").style.display="block";
    if(!chatToggleBtn.hasClass('is-visible')){
      toggleChatWindow();
    }
    bigChatBox();
  }, function(err) {
    console.log("client leave failed ", err); //error handling
  });
  stopScreenShare();
}

//create a function which tells the client that someone's screen sharing is active
function otherScreenShareActiveStatus(){
  otherScreenShareActive=true;
}
//create a function which tells the client that the screen sharing has been stopped.
function otherScreenShareInactiveStatus(){
  otherScreenShareActive=false;
}
//create a function which brings the chat box to its initial dimension.
function bigChatBox() {
  $('.chat').css({
    'right': '300px',
    'bottom': '150px',
    'overflow': 'visible'
    });
  $('#chat_fullscreen').css({
    'height':'100%'
    });
}
