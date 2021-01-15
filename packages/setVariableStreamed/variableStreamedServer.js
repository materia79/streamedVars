// Set a variable that is only sent to other players when they have that player with variable set streamed in
mp.Player.prototype.setVariableStreamed = function (key, value) {
  this.variables[key] = { value: value, lastValue: {} };
  this.call("setVariableStreamed", [this.id, this.type, key, value]);

  if (this.streamedPlayers) this.streamedPlayers.forEach((player) => {
    player.call("setVariableStreamed", [this.id, this.type, key, value]);
    this.variables[key].lastValue[player.id] = value;
  });
};

mp.Player.prototype.getVariableStreamed = function (key) {
  return this.variables[key] ? this.variables[key].value : undefined;
};

const entityStreamIn = (player, entity) => {
  for (let key in entity.variables) {
    if (!entity.variables[key].lastValue[player.id] || entity.variables[key].lastValue[player.id] != entity.variables[key].value) {
      player.call("setVariableStreamed", [entity.id, entity.type, key, entity.variables[key].value]);
      entity.variables[key].lastValue[player.id] = entity.variables[key].value;
    }
  }
};

const forwardedEntityStream = {
  "player": mp.players,
  "ped": mp.peds
}

mp.events.add("playerJoin", (player) => {
  player.variables = {};
});

mp.events.add("entityStreamIn", (player, entityType, entityId) => {
  const entity = forwardedEntityStream[entityType] ? forwardedEntityStream[entityType].at(entityId) : false;

  if (entity && forwardedEntityStream[entityType].exists(entity)) { // DEBUG: console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);
    entityStreamIn(player, entity);
  }
});
