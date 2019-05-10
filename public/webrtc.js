/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: true,
  video: {
    focusMode: 'manual',
    brightness: 0
  },
  focusMode: 'manual',
  brightness: 0, 

};

async function handleSuccess(stream) {
  const video = document.querySelector('video');
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  
  video.srcObject = stream;

  const pc = new RTCPeerConnection();
  
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const request = new Request('/connection', {
    method: 'POST', 
    body: JSON.stringify(offer),        
    headers: {
      "Content-Type": "application/json",
    },
  });

  try {
    const response = await fetch(request);
    const answer = response.json();
  } catch(e) {
    await pc.setRemoteDescription(offer);
  }
}

function handleError(error) {
  if (error.name === 'ConstraintNotSatisfiedError') {
    let v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log(stream);
    handleSuccess(stream);
  } catch (e) {
    handleError(e);
  }
}

window.onload = () => {
  console.log('Initializing')
  init();
}