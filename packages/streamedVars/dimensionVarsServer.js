const entityTypes = ["players", "vehicles", "peds"];
const setDimension = function (dim) {
  if (this.dimensionVariables) {
    Object.key(this.dimensionVariables).forEach(key => {
      if (!this.dimensionVariables[key].persistent) delete this.dimensionVariables[key];
    });
    mp.players.forEachInDimension(this.dimension, syncDimensionVariables.bind({entity: this}));
  } else this.dimensionVariables = {};
  mp.events.call('entityDimensionChange', this, dim, this.dimension);
  mp.events.callRemote('entityDimensionChange', this, dim, this.dimension);
  this.dimension = dim;
  if (this.type == 'player') updateDimensionVariables(dim).bind({player: this});
}
mp.Player.prototype.setDimension = mp.Vehicle.prototype.setDimension = mp.Ped.prototype.setDimension = setDimension;
const getDimensionVariable = function (key) {
  if (!this.dimensionVariables) this.dimensionVariables = {};
  return mp[this.type + 's'].exists(this) && this.dimensionVariables[key] ? this.dimensionVariables[key].value : undefined;
};
mp.Player.prototype.getDimensionVariable = mp.Vehicle.prototype.getDimensionVariable = mp.Ped.prototype.getDimensionVariable = getDimensionVariable;

const setDimensionVariable = function (key, data, persistent = false) {
  if (!this.dimensionVariables) this.dimensionVariables = {};
  if (this.dimensionVariables[key] && this.dimensionVariables[key].value == data) return;
  if (this.type == 'player') this.call('setDimVariable', [this.type, this.id, key, data]);
  this.dimensionVariables[key] = {
    value: data,
    persistent: persistent
  };
  mp.players.forEachInDimension(this.dimension, syncDimensionVariables.bind({entity: this}));
}
mp.Player.prototype.setDimensionVariable = mp.Vehicle.prototype.setDimensionVariable = mp.Ped.prototype.setDimensionVariable = setDimensionVariable;

mp.events.add({
  "playerReady": (player) => {
    player.dimensionVariables = {};
    updateDimensionVariables(player.dimension).bind({player: player}); // In case there are variables in dimension 0
  },
  "playerQuit": (player) => {
    mp.players.forEach(p => {
      if (mp.players.exists(p) && p.dimensionVariables) {
        Object.keys(p.dimensionVariables).forEach(key => {
          if (p.dimensionVariables[key].lastValue[player.id]) delete p.dimensionVariables[key].lastValue[player.id];
        });
      }
    });
  }
});

const updateDimensionVariables = function (dim) {
  if (mp.players.exists(this.player)) {
    entityTypes.forEach(entityType => {
      mp[entityType].forEachInDimension(dim, dimensionVarHandling.bind({player: this.player}))
    });
  }
};

const syncDimensionVariables = function (player) {
  if (this.entity.type == 'player' && player.id == this.entity.id) return;
    if (!this.entity.dimensionVariables[key].lastValue[player.id] || this.entity.dimensionVariables[key].lastValue[player.id] != this.entity.dimensionVariables[key].value) {
      player.call('setDimVariable', [this.entity.type, this.entity.id, key, data]);
      this.entity.dimensionVariables[key].lastValue[player.id] = data;
    }
};

const dimensionVarHandling = function (entity) {
  if (!entity.dimensionVariables) entity.dimensionVariables = {};
  else {
    if (entity.type == 'player' && entity.id == this.player.id) return;
    Object.keys(entity.dimensionVariables).forEach(key => {
      if (!entity.dimensionVariables[key].lastValue[this.player.id] || entity.dimensionVariables[key].lastValue[this.player.id] != entity.dimensionVariables[key].value) {
        this.player.call('setDimVariable', [entity.type, entity.id, key, entity.dimensionVariables[key].value]);
        entity.dimensionVariables[key].lastValue[this.player.id] = entity.dimensionVariables[key].value;
      }
    });
  }
};