const { getWss } = require('./ws_config');
const WebSocket = require('ws');
const { rooms } = require('../roomStore');
//help to transfer the room data properly
function serializeRoom(room) {
  return {
    id: room.id,
    type: room.type,
    players: room.participants.length,
    maxPlayers: room.maxPlayers,
    host: room.host,
    participants: room.participants.map(p => p.pseudo),
  };
}
//send the state of the room to all the players
function broadcastRoomUpdate() {
  const wss = getWss();
  if (!wss) return;
  const roomsData = Object.values(rooms).map(serializeRoom);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type : 'rooms-update', roomsData }));
    }
  });
}

module.exports = { serializeRoom, broadcastRoomUpdate };
