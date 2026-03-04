// setters and getters for ws modules and fastify instance
let fastifyInstance = null;
let wssInstance = null;

function setFastifyInstance(f) {
  fastifyInstance = f;
}
function getFastifyInstance() {
  return fastifyInstance;
}

function setWss(wss) {
  wssInstance = wss;
}
function getWss() {
  return wssInstance;
}

module.exports = { setFastifyInstance, getFastifyInstance, setWss, getWss };
