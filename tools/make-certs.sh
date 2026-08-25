#!/usr/bin/env bash
# Retired at v1.03.02 — the server issues its own certificate in pure Node at boot, and
# manual reissue is `node tools/make-certs.mjs`. This shim exists so an old habit or an
# old doc pointing here still lands somewhere useful. (The openssl flow this replaced
# could fail half-way and leave a key with no certificate, which crashed the server on
# the first real Windows deployment. Never again; see server/certs.js.)
exec node "$(dirname "$0")/make-certs.mjs" "$@"
