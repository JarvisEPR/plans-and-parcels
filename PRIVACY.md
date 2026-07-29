# Privacy

Plans & Parcels uses temporary guest identities. It does not require an account, advertising
identifier, or analytics profile.

## Temporary room data

A room stores display names, role selections, game state, and the public event log inside one
Cloudflare Durable Object. The room is deleted 24 hours after creation.

The host can download an after-action JSON export while the room exists. That export is controlled
by the host after download.

## Operational logs

Application logs contain room codes, event or command types, processing latency, and error status.
They do not intentionally contain display names, IP addresses, chat, recommendation text, or
analytics events. Cloudflare may process ordinary request metadata as the infrastructure provider.

## Cookies

Secure, HTTP-only, same-site cookies hold random temporary host or player credentials. They expire
with the room and are used only for reconnection and authorization.

Do not use real names or include sensitive personal information in free-text game fields.
