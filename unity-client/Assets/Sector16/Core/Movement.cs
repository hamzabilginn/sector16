using System;

namespace Sector16
{
    // Direct port of shared/world.mjs, using doubles and the same order of operations.
    // Unity physics never decides the networked player's movement.
    public static class Movement
    {
        public const double Tick = 1.0 / 60;
        public static double Clamp(double n,double min,double max) => Math.Max(min,Math.Min(max,n));
        public static double Height(Body p) => p.crouch ? 1.12 : 1.78;
        public static double Eye(Body p) => p.y+(p.crouch ? .96 : 1.62);
        static bool Blocked(Body p,double x,double y,double z,Box[] boxes)
        {
            foreach(var b in boxes)
                if(y<b.y+b.h/2-.001 && y+Height(p)>b.y-b.h/2+.001 && x+.34>b.x-b.w/2 && x-.34<b.x+b.w/2 && z+.34>b.z-b.d/2 && z-.34<b.z+b.d/2) return true;
            return false;
        }
        static bool Step(Body p,double x,double z,Box[] boxes)
        {
            if(!p.ground) return false;
            double top=double.NegativeInfinity;
            foreach(var b in boxes)
            {
                if(x+.34<=b.x-b.w/2 || x-.34>=b.x+b.w/2 || z+.34<=b.z-b.d/2 || z-.34>=b.z+b.d/2) continue;
                var y=b.y+b.h/2;
                if(y>p.y+.001 && y<=p.y+.28) top=Math.Max(top,y);
            }
            if(double.IsNegativeInfinity(top) || Blocked(p,x,top,z,boxes)) return false;
            p.y=top;return true;
        }
        public static void Simulate(Body p,InputFrame i,MapData map,double dt=Tick)
        {
            var boxes=map.boxes;var oldCrouch=p.crouch;p.crouch=i.crouch;
            if(oldCrouch&&!p.crouch&&Blocked(p,p.x,p.y,p.z,boxes))p.crouch=true;
            p.yaw=double.IsNaN(i.yaw)||double.IsInfinity(i.yaw)?p.yaw:i.yaw;
            p.pitch=Clamp(double.IsNaN(i.pitch)||double.IsInfinity(i.pitch)?0:i.pitch,-1.45,1.45);
            double sx=Clamp(i.x,-1,1),sz=Clamp(i.z,-1,1),mag=Math.Sqrt(sx*sx+sz*sz);
            if(mag>1){sx/=mag;sz/=mag;}
            var speed=p.crouch?2.6:i.aim?3.1:i.sprint&&!i.fire?7.1:5.15;
            var tx=(Math.Cos(p.yaw)*sx+Math.Sin(p.yaw)*sz)*speed;
            var tz=(-Math.Sin(p.yaw)*sx+Math.Cos(p.yaw)*sz)*speed;
            var accel=p.ground?1-Math.Exp(-18*dt):1-Math.Exp(-4.5*dt);
            p.vx+=(tx-p.vx)*accel;p.vz+=(tz-p.vz)*accel;
            if(i.jump&&!p.jumpHeld&&p.ground){p.vy=6.3;p.ground=false;}p.jumpHeld=i.jump;
            var nx=p.x+p.vx*dt;
            if(!Blocked(p,nx,p.y,p.z,boxes)||Step(p,nx,p.z,boxes))p.x=nx;else p.vx=0;
            var nz=p.z+p.vz*dt;
            if(!Blocked(p,p.x,p.y,nz,boxes)||Step(p,p.x,nz,boxes))p.z=nz;else p.vz=0;
            var oldY=p.y;p.vy-=18*dt;p.y+=p.vy*dt;p.ground=false;
            foreach(var b in boxes)
            {
                if(p.x+.33<=b.x-b.w/2||p.x-.33>=b.x+b.w/2||p.z+.33<=b.z-b.d/2||p.z-.33>=b.z+b.d/2)continue;
                var top=b.y+b.h/2;var bottom=b.y-b.h/2;
                if(p.vy<=0&&oldY>=top-.02&&p.y<=top){p.y=top;p.vy=0;p.ground=true;}
                else if(p.vy>0&&oldY+Height(p)<=bottom+.02&&p.y+Height(p)>=bottom){p.y=bottom-Height(p);p.vy=0;}
            }
            if(p.y<=0){p.y=0;p.vy=0;p.ground=true;}
            p.x=Clamp(p.x,-map.width/2+.35,map.width/2-.35);p.z=Clamp(p.z,-map.depth/2+.35,map.depth/2-.35);
        }
    }
}
