const rooms = {}
const userRoomMap = {};
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
const ROOM_STATE = {
    WAITING: "waiting",
    COUNTDOWN: "countdown",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "game_over",
    TOURNAMENT_OVER: "tournament_over"
};


function createRoom({ type, host}) {
    if (!host) {
        console.error("createRoom called with no host", {type, host});
        return { error: "Rooms.NO_HOST" };
    }
    if (userRoomMap[host])
    {
        const oldRoomId = userRoomMap[host];
        if (rooms[oldRoomId]) {
            deleteRoom(oldRoomId);
        } else {
            delete userRoomMap[host];
        }
    }
    const roomId = "room_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);

    const room = {
        id: roomId,
        type,
        state: ROOM_STATE.WAITING,
        maxPlayers: type === "1v1" ? 2 : 8,
        countdownSeconds: 10,
        countdownStart: Date.now(),
        host,
        participants: [],
        players: { player1: null, player2: null },
        disconnectedTimout: null,
        disconnectedPlayer: null,
        tournament: type === "tournament"
            ?   {
                    started: false,
                    inProgress: false,
                    players: [],
                    matches: [],
                    nextRound: [],
                    currentMatchIndex: 0,
                }
            : null,

        paddles: {
            player1: { position: { x: 20, y: CANVAS_HEIGHT / 2 - 50 }, width: 10, height: 100, speed: 6, score: 0 },
            player2: { position: { x: CANVAS_WIDTH - 30, y: CANVAS_HEIGHT / 2 - 50 }, width: 10, height: 100, speed: 6, score: 0 },   
        },

        ball: {
            position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
            velocity: { x: 6, y: 4 },
            size: 10,
        },

        tickId : null,
        lastInputs: { player1: null, player2: null },
        lastInputTimes: { player1: 0, player2: 0 },
    };

    rooms[roomId] = room;
    userRoomMap[host] = roomId;
    return room;
}

function listRooms() {
    return Object.values(rooms).map(r => ({
        id: r.id,
        type: r.type,
        players: r.participants.length,
        maxPlayers: r.maxPlayers
    }));
}

function getRoom(roomId) {
    return rooms[roomId];
}

function deleteRoom(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.host) {
        delete userRoomMap[room.host];
    }

    room.participants.forEach(p => {
        delete userRoomMap[p.pseudo];
    });
    delete rooms[roomId];
}

function removeUserFromRoom(pseudo) {
    const roomId = userRoomMap[pseudo];
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) {
        delete userRoomMap[pseudo];
        return;
    }

    const index = room.participants.findIndex(p => p.pseudo === pseudo);
    if (index !== -1) room.participants.splice(index, 1);

    if (room.host === pseudo) {
        room.host = room.participants[0]?.pseudo || null;
    }

    delete userRoomMap[pseudo];

    if (room.participants.length === 0) deleteRoom(roomId);
}


module.exports = {
    rooms,
    createRoom,
    listRooms,
    getRoom,
    deleteRoom,
    userRoomMap,
    removeUserFromRoom,
    ROOM_STATE
};