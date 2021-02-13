# Variable types

This resource allows entity variable data handling between entities only forwarded within dimension or stream range. It's currently functional on the following entities:
- **player**
- **ped**
- **vehicle**

This resource is created and maintained by the [Project Unknown](https://discord.gg/FbVcFQj) team and requires [RAGE Multiplayer v1.1](https://rage.mp/).

**NOTE**: This resource requires dependency [Base](https://github.com/materia79/base) in-order to process console logs (which might be removed in the near future). Otherwise remove any trace of `mp.log` in this resource.

Check also the [Base](https://github.com/materia79/base) component [module loader](https://github.com/materia79/base/tree/master/modules) out which allows you to add multiple resources directly from git repositories as a submodule to your server project`s main git which helps you to expose parts of your server project to co devs without granting full repository access!

## Streamed variables

Entity variable data handling between entities and clients only forwarded within dimension or stream range. Useful to reduce the load and have better network optimization on other clients out of stream range.

### Server-side API
#### entity.setVariableStreamed(key, value)

Set a variable serverside which will only streamed to other players that are actually streaming the entity.
```js
player.setVariableStreamed("test", 123);
```

### Client-side API

#### entity.getVariableStreamed(key)

Works for local and remote players on own client. If variable is not set it will return `undefined`.
```js
let result = player.getVariableStreamed("test");
```

#### await entity.getVariableStreamedAsync(key, waitTime = 10)

Works for local and remote players on own client. If variable is not set it will await until it is not undefined anymore! If there is no interval waitTime specified it will be a 10ms interval.
```js
let result = await player.getVariableStreamedAsync("test");
```

#### mp.events.addDataHandlerStreamed(key, callback)

Works like the regular variable dataHandler except it will only announce updated streamed variables
```js
mp.events.addDataHandlerStreamed("test", (entity, value) => {
  mp.gui.chat.push("entity type: " + entity.type + " id: " + entity.remoteId + " changed its value: " + value);
});
```

**NOTE:** You can only add one streamed dataHandler per key for now.

#### mp.events.removeDataHandlerStreamed(key, callback)

Removes a previously created dataHandler for the case the same key is used in different situations.
```js
mp.events.removeDataHandlerStreamed("test", (entity, value) => {
  mp.gui.chat.push("entity type: " + entity.type + " id: " + entity.remoteId + " changed its value: " + value);
});
```

## Dimension variables

Globally synced variable data from entity to all clients in dimension. Usable to lower the load and have better network optimization for clients in other dimensions.

**NOTE**: This resourece only operates properly when using `entity.setDimension(dim);` instead of `entity.dimension = dim;` until RAGE Multiplayer implements an event that can detect dimension change.

(And when you are on it George: PLEASE add `entityStreamIn => (entity, forPlayer)` and `entityStreamOut => (entity, forPlayer)` server events triggering for player, peds and vehicles similar to the non working `playerStreamIn` events serverside. Thanks! That would simplify this resource alot already!😏)
### Server-side API

#### entity.setDimension(dim)

Sets entity dimension accoordingly.

#### entity.setVariableDimension("key", value, presistant = true)

Sets a dimension variable in the current entity's dimension. (presistant helps maintain the dimension variable across multiple dimension. When you change the dimension, the variable data will remain.)
```js
player.setVariableDimension("giga", "chad");
```

#### entity.getVariableDimension("key");

Gets a dimension variable data of the entity.
```js
player.getVariableDimension("giga"); // chad
```

### Client-side API

#### entity.getVariableDimension("key");

Gets a dimension variable data of the entity.
```js
mp.players.local.getVariableDimension("giga"); // chad
```

#### await entity.getVariableDimensionAsync("key");

Async version of `entity.getVariableDimension("key");`
```js
(async () => {
  let data = await mp.players.local.getVariableDimensionAsync("giga");
})();
```

#### mp.events.addDataHandlerDimension(key, callback)
Works like the regular variable datahandler except it will only announce updated dimension variables

```js
mp.events.addDataHandlerDimension("giga", (entity, value) => {
  mp.gui.chat.push("entity type: " + entity.type + " id: " + entity.remoteId + " at dimension: " + entity.dimension + "changed its value: " + value);
});
```