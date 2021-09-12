import { subscribe } from './events.js';
import { generateCode } from './generateCode.js';
import { io } from './globals.js';

/**
 * socket
 */
const socket = io({ upgrade: false, transports: ['websocket'] });
const socketSend = (obj) => socket.send(JSON.stringify(obj));

const connection = new RTCPeerConnection({
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
  ],
});

const RTCDataChannelState = {
  Closed: 'closed',
  Closing: 'closing',
  Connecting: 'connecting',
  Open: 'open',
};

export const channel = connection.createDataChannel('@kitdm/js13kgames-2021');
export const channelSend = (obj) =>
  channel.readyState === RTCDataChannelState.Open &&
  channel.send(JSON.stringify(obj));

export const negotiate = (isGuest) => {
  if (isGuest) {
    subscribe(connection, 'negotiationneeded', async () => {
      try {
        const offer = await connection.createOffer();
        await connection.setLocalDescription(new RTCSessionDescription(offer));
        socketSend({ description: connection.localDescription });
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
          socketSend({ description: connection.localDescription });

          if (!isGuest) {
            const offer = await connection.createOffer();
            await connection.setLocalDescription(
              new RTCSessionDescription(offer),
            );
            socketSend({ description: connection.localDescription });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
};
