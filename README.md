Prototypes for `player`, `ped` and `vehicle` object variables which are updated only to clients that are streaming these entities.

This resource is part of [Project_Unknown](https://discord.gg/FbVcFQj) and ready to run in [RAGE MultiPlayer](https://rage.mp/).


# server
## player.setVariableStreamed(key, value)

set a variable serverside which will only streamed to other players that are actually streaming the entity.
```js
player.setVariableStreamed("test", 123);
```

# client

## player.getVariableStreamed(key)

works for local and remote players on own client. If variable is not set it will return `undefined`.
```js
let result = player.getVariableStreamed("test");
```

## await player.getVariableStreamedAsync(key, waitTime = 10)

works for local and remote players on own client. If variable is not set it will await until it is not undefined anymore! If there is no interval waitTime specified it will be a 10ms interval.
```js
let result = await player.getVariableStreamedAsync("test");
```

## mp.events.addDataHandlerStreamed(key, callback)

works like the regular variable datahandler except it will only announce updated streamed variables
```js
mp.events.addDataHandlerStreamed("test", (entity, value) => {
  mp.gui.chat.push("entity type: " + entity.type + " id: " + entity.remoteId + " changed its value: " + value);
});
```