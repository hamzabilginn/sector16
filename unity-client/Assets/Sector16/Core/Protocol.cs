using System;

namespace Sector16
{
    // Field names are the existing JSON wire protocol. Coordinates stay in server space.
    [Serializable] public class Body
    {
        public double x, y, z, vx, vy, vz, yaw, pitch;
        public bool ground = true, crouch, jumpHeld;
        public Body Copy() => (Body)MemberwiseClone();
        public void Restore(Body b)
        { x=b.x; y=b.y; z=b.z; vx=b.vx; vy=b.vy; vz=b.vz; yaw=b.yaw; pitch=b.pitch; ground=b.ground; crouch=b.crouch; jumpHeld=b.jumpHeld; }
    }
    [Serializable] public class InputFrame
    {
        public long seq;
        public double x, z, yaw, pitch;
        public bool interact, jump, crouch, sprint, aim, fire, reload;
        public string weapon = "rifle";
    }
    [Serializable] public class InputMessage
    { public string type = "input"; public InputFrame[] inputs; }
    [Serializable] public class Command
    {
        public string type, nickname, room, password, team, name, map, mode, item, kind, id, weapon;
        public int maxPlayers=8, minutes=8, botCount=0;
        public bool bots=false;
        public double t, ms;
    }
    [Serializable] public class RoomInfo
    { public string id, name, map, mapId, mode; public int players, bots, maxPlayers, botCount; public bool locked; }
    [Serializable] public class PlayerState : Body
    {
        public string id, name, team, primary, secondary, weapon;
        public int hp, armor, money, ammo, reserve, kills, deaths, grenades, medkits, generation;
        public long ack;
        public bool bot, canBuy, invuln;
        public double reload, respawn;
        public WeaponAttachments attachments;
        public UtilityState utility;
    }
    [Serializable] public class UtilityState { public int he,flash,smoke; }
    [Serializable] public class AttachmentState { public bool scope, suppressor, extended; }
    [Serializable] public class WeaponAttachments
    {
        public AttachmentState rifle, m4, awp, smg, shotgun, pistol, deagle, m249, knife;
        public AttachmentState Get(string id)
        {
            switch(id) { case "rifle":return rifle; case "m4":return m4; case "awp":return awp; case "smg":return smg; case "shotgun":return shotgun; case "pistol":return pistol; case "deagle":return deagle; case "m249":return m249; default:return knife; }
        }
    }
    [Serializable] public class Scores { public int blue, orange; }
    [Serializable] public class PointState { public string id, kind; public double x,y,z,until; }
    [Serializable] public class FlagState { public string team, carrier; public double x,y,z; }
    [Serializable] public class Flags { public FlagState blue, orange; }
    [Serializable] public class BombState
    { public string state, carrier, site, plantBy, defuseBy; public double x,y,z,plantStart,defuseStart,detonateAt; }
    [Serializable] public class EscortState
    { public double x,z,yaw,progress; public int attackers,defenders,checkpoint; public bool contested,completed; }
    [Serializable] public class Envelope
    {
        public string type, id, team, message, map, mode, phase, weapon, kind, winner, killer, victim, victimId;
        public RoomInfo room;
        public RoomInfo[] rooms;
        public PlayerState[] players;
        public Scores scores;
        public Flags flags;
        public BombState bomb;
        public EscortState escort;
        public PointState[] grenades, smokes;
        public PointState position, from, to;
        public int matchId, round, roundTarget, damage;
        public bool head,kill,suppressed;
        public double time, remaining, restart, t, duration;
    }
    [Serializable] public class Box
    { public double x,y,z,w,h,d; public string kind; public int color; }
    [Serializable] public class RecoilPoint { public double x,y; }
    [Serializable] public class WeaponDefinition
    { public string id,name,slot; public int mag,reserve,price; public double interval,kick,reload; public bool melee; public RecoilPoint[] pattern; }
    [Serializable] public class MapData
    {
        public string id,name;
        public double width=56, depth=64, baseZ=28;
        public int floor,sky;
        public Box[] boxes;
        public PointState[] sites;
    }
    [Serializable] public class WorldData
    { public MapData[] maps; public WeaponDefinition[] weapons; }
}
