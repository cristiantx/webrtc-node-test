var localVideo;
var localStream;
var remoteVideo;
var peerConnection;
var idSession;
var serverConnection;

var peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

function pageReady() {
  remoteVideo = document.getElementById('remoteVideo');
  serverConnection = new WebSocket('wss://staging-demo.instance.streamix.live/studio');
  serverConnection.onmessage = gotMessageFromServer;
}

function start(isCaller) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.ontrack = gotRemoteStream;

  if(isCaller) {
    peerConnection.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true
    }).then(createdDescription).catch(errorHandler);
  }
}

function gotMessageFromServer(message) {
  var signal = JSON.parse(message.data);

  switch (signal.id) {
    case 'welcome':
      idSession = signal.idSession;
      var message = {
				id: 'joinRoom',
				room: 'demo',
				type: 'studio',
				name: 'basic testing',
				settings: {}
      };
      serverConnection.send(JSON.stringify(message));
      break;
    case 'sync':
      console.log('sync')
      if (!peerConnection) {
        start(true);
      }
      break;
    case 'receivePreviewAnswer':
      peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdpAnswer })).then(function() {
        // Only create answers in response to offers
        peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
      }).catch(errorHandler);
      break;
    case 'previewIceCandidate':
      peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(errorHandler);
      break;
    case 'stop':
    case 'stopCommunication':
    case 'kick':
    case 'ping':
      // Nothing!
      break;
    default:
      console.warn('Unrecognized message', message);
  }
}

function gotIceCandidate(event) {
  if(event.candidate != null) {
    var message = {
			id: 'onPreviewIceCandidate',
			candidate: event.candidate
		};
    serverConnection.send(JSON.stringify(message));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function() {
    var message = {
      id: 'receivePreview',
      sdpOffer: peerConnection.localDescription.sdp
    }
    serverConnection.send(JSON.stringify(message));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  remoteVideo.srcObject = event.streams[0];
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}