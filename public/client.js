/**
 * globals
 */
const win = window;
const { devicePixelRatio: dpr, requestAnimationFrame: raf } = win;
const ctx = c.getContext('2d');
const { floor, PI: π, random, sin } = Math;

/**
 * events
 */
const subscribe = (target, type, listener, options = false) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

const dispatch = (target, type) => target.dispatchEvent(new Event(type));

/**
 * resizing
 */
subscribe(win, 'resize', () => {
  const { innerWidth: w, innerHeight: h } = win;

  c.width = w * dpr;
  c.height = h * dpr;

  c.style.width = `${c.width}px`;
  c.style.height = `${c.height}px`;
  c.style.transform = `scale(${1 / dpr})`;
});

dispatch(win, 'resize');

/**
 * socket
 */
const socket = io({ upgrade: false, transports: ['websocket'] });
const connection = new RTCPeerConnection({
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
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
  state[`${pointerType}:${pointerId}`] = { x, y };
};
const removePointer = ({ pointerId, pointerType }) => {
  delete state[`${pointerType}:${pointerId}`];
};

subscribe(c, 'pointerdown', (event) => {
  addPointer(event);

  const unsub = subscribe(c, 'pointermove', updatePointer);
  const cleanup = (event) => {
    removePointer(event);
    unsub();
  };

  subscribe(c, 'pointerup', cleanup, { once: true });
  subscribe(c, 'pointercancel', cleanup, { once: true });
});

/**
 * game loop
 */
const draw = (t) => {
  raf(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  Object.values(state).forEach(({ h, x, y }) => {
    ctx.fillStyle = `hsl(${h}, 80%, 50%)`;

    ctx.beginPath();

    const p = 10;
    const r = (p * 2 + sin(t / 400) * p) * dpr;
    ctx.ellipse(x * dpr, y * dpr, r, r, 0, 0, π * 2);
    ctx.fill();
  });
};

raf(draw);
