# Network & workers

[index](../README.md)

fetch() endpoints (server.py routes), workers, sockets, postMessage.

15 distinct values across 8 files.

### `./worker.js`

- net.Worker — [js/bodygen/grower.js › boot](../files/js/bodygen/grower.js.md#s-boot) L19

### `‹(spreadelement)›`

- net.fetch — [js/net/account.js › account.fetch](../files/js/net/account.js.md#s-account-fetch) L39

### `‹path›`

- net.fetch — [js/net/account.js › call](../files/js/net/account.js.md#s-call) L110

### `‹url›`

- net.fetch — [js/bodygen/worker.js › loadModule](../files/js/bodygen/worker.js.md#s-loadModule) L9
- net.fetch POST — [js/comms/call-scripts.js › llamaProvider](../files/js/comms/call-scripts.js.md#s-llamaProvider) L343
- net.fetch POST — [js/npc/captain.js › llamaCaptainProvider](../files/js/npc/captain.js.md#s-llamaCaptainProvider) L472

### `/cradle/all?room=${…}`

- net.fetch — [js/npc/cradle.js › pullRemote](../files/js/npc/cradle.js.md#s-pullRemote) L365

### `/cradle/put`

- net.fetch POST — [js/npc/cradle.js › flushRemote>put](../files/js/npc/cradle.js.md#s-flushRemote-put) L420

### `/gdb/all?room=${…}`

- net.fetch — [js/corp/gdb.js › connectGdb](../files/js/corp/gdb.js.md#s-connectGdb) L323

### `/gdb/put`

- net.fetch POST — [js/corp/gdb.js › flushGdb](../files/js/corp/gdb.js.md#s-flushGdb) L297

### `/net/poll?${…}`

- net.fetch — [js/net/net.js › poll](../files/js/net/net.js.md#s-poll) L132

### `/net/send`

- net.fetch POST — [js/net/net.js › post](../files/js/net/net.js.md#s-post) L74

### `/net/world`

- net.fetch POST — [js/net/net.js › pushWorld](../files/js/net/net.js.md#s-pushWorld) L118

### `/net/world?${…}`

- net.fetch — [js/net/net.js › fetchWorld](../files/js/net/net.js.md#s-fetchWorld) L91

### `/net/world?room=sol`

- net.fetch — [js/net/net.js › primeSol](../files/js/net/net.js.md#s-primeSol) L100

### `self`

- net.postMessage — [js/bodygen/worker.js](../files/js/bodygen/worker.js.md) L40
- net.postMessage — [js/bodygen/worker.js](../files/js/bodygen/worker.js.md) L42
- net.postMessage — [js/bodygen/worker.js](../files/js/bodygen/worker.js.md) L46
- net.postMessage — [js/bodygen/worker.js](../files/js/bodygen/worker.js.md) L46

### `worker`

- net.postMessage — [js/bodygen/grower.js › drain](../files/js/bodygen/grower.js.md#s-drain) L67
