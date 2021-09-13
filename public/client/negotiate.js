import { subscribe } from './events.js';
import { generateCode } from './generateCode.js';
import { io } from './globals.js';

/**
 * socket
 */
const socket = io({ upgrade: false, transports: ['websocket'] });

const socketConnected = () =>
  !socket.connected
    ? new Promise((resolve) => socket.once('connect', () => resolve(true)))
    : Promise.resolve(true);

const socketSend = async (obj) => {
  await socketConnected();
  socket.send(JSON.stringify(obj));
};

const connection = new RTCPeerConnection({
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
  ],
  sdpSemantics: 'unified-plan',
});
const channel = connection.createDataChannel('@kitdm/js13kgames-2021');

const channelOpen = () =>
  channel.readyState !== 'open'
    ? new Promise((resolve) =>
        subscribe(channel, 'open', () => resolve(true), { once: true }),
      )
    : Promise.resolve(true);

export const channelSend = async (obj) => {
  await channelOpen();
  channel.send(JSON.stringify(obj));
};

export const negotiate = (isGuest, onOpen, onMessage, onCloseError) => {
  subscribe(connection, 'datachannel', (event) => {
    subscribe(event.channel, 'open', onOpen);
    subscribe(event.channel, 'message', onMessage);
    ['close', 'error'].forEach((eventName) =>
      subscribe(event.channel, eventName, onCloseError),
    );
  });

  if (isGuest) {
    subscribe(connection, 'negotiationneeded', async () => {
      try {
        const offer = await connection.createOffer();
        /**
         * ¯\_(ツ)_/¯
         * @see https://github.com/feross/simple-peer/blob/9ea1805/index.js#L16
         */
        // offer.sdp = offer.sdp.replace(/a=ice-options:trickle\s\n/g, '');
        await connection.setLocalDescription(new RTCSessionDescription(offer));
        await socketSend({ description: connection.localDescription });
      } catch (error) {
        console.error(error);
      }
    });
  } else {
    console.log(generateCode());
  }

  subscribe(connection, 'icecandidate', ({ candidate }) =>
    socketSend({ candidate }),
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

        if (description.type === 'offer') {
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          await socketSend({ description: connection.localDescription });
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
};
