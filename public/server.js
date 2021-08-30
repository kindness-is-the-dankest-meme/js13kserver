const sockets = new Map();

module.exports = {
  io: (socket) => {
    sockets.set(socket.id, socket);

    socket.on('message', (data) => {
      sockets.forEach((s, i) => {
        if (socket.id === i) {
          return;
        }

        s.send(data);
      });
    });

    socket.on('disconnect', () => {
      sockets.delete(socket.id);
    });
  },
};
