import { subscribe } from './events.js';
import { generateCode } from './generateCode.js';
import {
  c,
  ctx,
  dpr,
  floor,
  io,
  m,
  raf,
  random,
  sin,
  win,
  π,
} from './globals.js';
import { resize } from './resize.js';

const scale = 16;
resize(m, c, scale);

/**
 * socket
 */
const socket = io({ upgrade: false, transports: ['websocket'] });
const connection = new RTCPeerConnection({
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
});
const channel = connection.createDataChannel('@kitdm/js13kgames-2021');

const isRude = 'ontouchstart' in win;
if (isRude) {
  subscribe(connection, 'negotiationneeded', async () => {
    try {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(new RTCSessionDescription(offer));
      socket.send(JSON.stringify({ description: connection.localDescription }));
    } catch (error) {
      console.error(error);
    }
  });
} else {
  console.log(generateCode());
}

subscribe(connection, 'icecandidate', ({ candidate }) =>
  socket.send(JSON.stringify({ candidate })),
);

socket.on('message', async (data) => {
  const { candidate, description } = JSON.parse(data);

  try {
    if (candidate && candidate.candidate !== '') {
      await connection.addIceCandidate(candidate);
    }

    if (description) {
      /**
       * @see https://github.com/node-webrtc/node-webrtc/issues/674
       * @see https://github.com/node-webrtc/node-webrtc/issues/677
       */
      await connection.setRemoteDescription(description);

      if (!isRude && description.type === 'offer') {
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);

        socket.send(
          JSON.stringify({ description: connection.localDescription }),
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
});

subscribe(channel, 'open', (event) => {
  console.log('open', event);
});

subscribe(channel, 'close', (event) => {
  console.log('close', event);
});

subscribe(channel, 'error', (event) => {
  console.log('error', event);
});

subscribe(channel, 'message', (event) => {
  console.log('message', event);
});

/**
 * state
 */
const state = {};

const addPointer = ({ pointerId, pointerType, x, y }) => {
  state[`${pointerType}:${pointerId}`] = { h: floor(random() * 360), x, y };
};
const updatePointer = ({ pointerId, pointerType, x, y }) => {
  if (!state[`${pointerType}:${pointerId}`]) {
    return;
  }

  state[`${pointerType}:${pointerId}`].x = x;
  state[`${pointerType}:${pointerId}`].y = y;
};
const removePointer = ({ pointerId, pointerType }) => {
  delete state[`${pointerType}:${pointerId}`];
};

subscribe(c, 'pointerdown', addPointer);
subscribe(c, 'pointermove', updatePointer);
subscribe(c, 'pointerup', removePointer);
subscribe(c, 'pointercancel', removePointer);

/**
 * game loop
 */
const draw = (t) => {
  raf(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  Object.values(state).forEach(({ h, x, y }) => {
    ctx.fillStyle = `hsl(${h}, 80%, 50%)`;

    ctx.beginPath();

    const p = 20 / scale;
    const r = (p * 2 + sin((t + h) / 360) * p) * dpr;
    ctx.ellipse((x / scale) * dpr, (y / scale) * dpr, r, r, 0, 0, π * 2);
    ctx.fill();
  });
};

raf(draw);
