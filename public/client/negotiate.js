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

const connectionSendOffer = async () => {
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
};

const connectionSendAnswer = async () => {
  try {
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    await socketSend({ description: connection.localDescription });
  } catch (error) {
    console.error(error);
  }
};

const RTCDataChannelState = {
  Closed: 'closed',
  Closing: 'closing',
  Connecting: 'connecting',
  Open: 'open',
};

export const channel = connection.createDataChannel('@kitdm/js13kgames-2021');
export const channelSend = (obj) => {
  console.log(
    'channel',
    channel.readyState,
    channel.readyState === RTCDataChannelState.Open,
    obj,
  );
  channel.readyState === RTCDataChannelState.Open &&
    channel.send(JSON.stringify(obj));
};

export const negotiate = (isGuest, onOpen, onCloseError) => {
  if (isGuest) {
    subscribe(connection, 'negotiationneeded', connectionSendOffer);
  } else {
    subscribe(connection, 'datachannel', () => {
      console.log('datachannel');

      subscribe(channel, 'open', onOpen);

      ['close', 'error'].forEach((eventName) =>
        subscribe(channel, eventName, onCloseError),
      );
    });
    console.log(generateCode());
  }

  subscribe(
    connection,
    'icecandidate',
    async ({ candidate }) => await socketSend({ candidate }),
  );

  socket.on('message', async (data) => {
    const { candidate, description } = JSON.parse(data);
    console.log({ candidate, description });

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
          await connectionSendAnswer();
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
};
