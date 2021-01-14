/*
const playerVariables = {};
for (let i = 0; i < 2**16; i++) {
  playerVariables[i] = { }
};

mp.Player.prototype.setVariableStreamed = (key, value) => {
  playerVariables[this.id][key] = value;
  if (this.streamedPlayers.length) mp.players.call(this.streamedPlayers, "setVariableStreamed" [this, key, value]);
};

mp.events.add("playerStreamIn", (player, forPlayer) => {
  for (let key in playerVariables[player.id]) forPlayer.call("setVariableStreamed", [forPlayer, key, playerVariables[player.id]]);
});
*/

const forwardedEntityStream = {
  "player": mp.players,
  "ped": mp.peds
}
mp.events.add("entityStreamIn", (player, entityType, entityId) => {
  if (forwardedEntityStream[entityType] && forwardedEntityStream[entityType].exists(forwardedEntityStream[entityType].at(entityId))) {
    console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);
  }
});
