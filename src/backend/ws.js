const WebSocket= require("ws");

function initWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    
    const players = { player1: null, player2: null};

    wss.on("connection", (ws) => {
        console.log("un jouer s'est connecté");

        if (!players["player1"]) {
            players["player1"] = ws;
            ws.send(JSON.stringify({ type: "assign", player: "player1"}));
        }
        else if (!players["player2"]) {
            players["player2"] = ws;
            ws.send(JSON.stringify({ type: "assign", player: "player2"}));
        } else {
            ws.send(JSON.stringify({ type: "full" }));
            ws.close();
            return;
        }
        
        ws.on("message", (msg) => {
            const data = JSON.parse(msg.toString());
            if (data.type === "input") {
                const otherPlayer = ws === players["player1"] ? players["player2"] : players["player1"];
                if (otherPlayer && otherPlayer.readyState === WebSocket.OPEN) {
                    otherPlayer.send(JSON.stringify({ type: "input", key: data.key}));
                }
            }
        });

        ws.on("close", () => {
            if (players["player1"] == ws) players["player1"] = undefined;
            if (players["player2"] == ws) players["player2"] = undefined;
            console.log("Un joueur s'est déconnecté");
        });
    });
    return wss;
}

module.exports = { initWebSocket };