const socket = io(); // same origin

socket.on('connect', () => {
    console.log('connected: ' + socket.id);
});

socket.on('message', (data) => {
    console.log('server → ' + JSON.stringify(data));
});