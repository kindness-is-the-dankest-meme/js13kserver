module.exports = {
  io: (socket) => {
    socket.on('message', (data) => {
      const parsedData = JSON.parse(data);

      if ('candidate' in parsedData || 'description' in parsedData) {
        io.sockets.sockets.forEach((s, i) => {
          if (socket.id === i) {
            return;
          }

          s.send(data);
        });

        return;
      }

      // do something with rooms here
      console.log(parsedData);
    });
  },
};
