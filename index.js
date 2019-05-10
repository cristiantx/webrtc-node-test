const express = require('express');
const path = require('path');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
const port = parseInt(process.env.PORT, 10) || 3100

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => console.log('Server started on '+port+'. Press Ctrl+C to quit'));

app.post(`/connection`, async (req, res) => {
  const pc = new RTCPeerConnection({
    sdpSemantics: "plan-b"
  });
  await pc.setRemoteDescription(new RTCSessionDescription(req.body));
  const answer = await pc.createAnswer();
  res.send(answer);
});

