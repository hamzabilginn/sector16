# Mobile controls, room recovery and spectator follow

- Separate saved touch sensitivity; button scale 85–115%; standard, left-handed and inset layouts. Open Control Settings from the in-game menu or Settings from the lobby. Reset restores mobile defaults.
- After a dropped connection, retry the same room for up to 45 seconds. The password stays in page memory only. Cancel stops automatic room entry; intentional Leave does not rejoin. Missing/full rooms return an error. This is a fresh room join: scores, equipment and player identity are not restored. Server restart or page reload cannot restore the room session.
- In round/bomb modes after death, Q/E cycle living teammates; V returns to free camera. Mobile has matching buttons. A dead/departed target switches to another living teammate, or free camera if none remain. Respawn clears follow mode.
- Fixed free-camera mouse movement being cleared by every authoritative snapshot.

Validation: scripts/options-check.mjs covers persisted settings, mirrored controls, password-room recovery, cancellation, deliberate leave, teammate follow, target death and respawn. Existing mobile and desktop browser checks also pass. npm run build:mobile bundles assets for the next native build; existing AAB/IPA artifacts are unchanged.
