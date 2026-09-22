# Sector16 2.1.0

- Karmaşa Şehri: 128 × 144 m, eight accessible interiors, eight exterior staircases, six roof bridges, asymmetrical checkpoints and service lanes, market lanes and service yards. Map-specific movement/spectator bounds, navigation, resupply, flag bases and bomb sites. Permanent 16-player city room with 11 bots.
- Team supply attachments: suppressor, 2× scope, extended magazine. T on desktop or tap the nearby attachment button on mobile. Free, server-authoritative distance/team/alive/mode/compatibility validation, two-second pickup cooldown. Attachments apply to the equipped weapon and survive a round only when the player survives. Death resets them. Extended magazine increases capacity by 50%; reload uses existing reserve ammunition, with no free ammunition grant. AWP retains its native 4×/8× scope.
- Suppressors change view model, reduce shot volume/filter brightness and muzzle flash. Scope and extended magazine also change the held model.
- Hit confirmation distinguishes body, armor, head and kill sounds. Armor sparks, victim-specific kill notice, server-confirmed wall/floor impacts and fading bullet decals with a bounded effect pool.
- Existing buy system, cash rewards, M249 supply and nickname-based resistance preserved.

Validation: automated gameplay tests, real movement/pickup/reload/aim/fire through mobile controls in a browser, city overview visual check, mobile asset synchronization, and deployment health/WebSocket checks. Browser emulation does not replace physical iPad testing or App Store review.
