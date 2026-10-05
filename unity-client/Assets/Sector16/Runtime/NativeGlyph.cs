using UnityEngine;
using UnityEngine.UI;
namespace Sector16
{
    [ExecuteAlways,RequireComponent(typeof(CanvasRenderer))]
    public sealed class NativeGlyph : MaskableGraphic
    {
        public string Kind;
        protected override void OnPopulateMesh(VertexHelper mesh)
        {
            mesh.Clear();float scale=rectTransform.rect.width/30;
            if(Kind=="fire"||Kind=="aim"||Kind=="crosshair")
            {if(Kind!="crosshair")Ring(mesh,Vector2.zero,10*scale,1.5f*scale);Line(mesh,new Vector2(-14,0)*scale,new Vector2(-6,0)*scale,1.4f*scale);Line(mesh,new Vector2(6,0)*scale,new Vector2(14,0)*scale,1.4f*scale);Line(mesh,new Vector2(0,-14)*scale,new Vector2(0,-6)*scale,1.4f*scale);Line(mesh,new Vector2(0,6)*scale,new Vector2(0,14)*scale,1.4f*scale);if(Kind=="fire")Ring(mesh,Vector2.zero,3*scale,2*scale);}
            else if(Kind=="hit"){for(int x=-1;x<=1;x+=2)for(int y=-1;y<=1;y+=2)Line(mesh,new Vector2(x*5,y*5)*scale,new Vector2(x*11,y*11)*scale,2*scale);}
            else if(Kind=="reload"){Ring(mesh,Vector2.zero,9*scale,2*scale);Line(mesh,new Vector2(9,0)*scale,new Vector2(14,4)*scale,2*scale);Line(mesh,new Vector2(9,0)*scale,new Vector2(4,4)*scale,2*scale);}
            else if(Kind=="jump"||Kind=="crouch"){float sign=Kind=="jump"?1:-1;Line(mesh,new Vector2(-9,0)*scale,new Vector2(0,sign*9)*scale,2*scale);Line(mesh,new Vector2(0,sign*9)*scale,new Vector2(9,0)*scale,2*scale);Line(mesh,new Vector2(0,-sign*10)*scale,new Vector2(0,sign*8)*scale,2*scale);}
            else if(Kind=="medkit"){Line(mesh,new Vector2(-9,0)*scale,new Vector2(9,0)*scale,5*scale);Line(mesh,new Vector2(0,-9)*scale,new Vector2(0,9)*scale,5*scale);}
            else if(Kind=="grenade"){Ring(mesh,new Vector2(0,-3)*scale,8*scale,2*scale);Line(mesh,new Vector2(-2,4)*scale,new Vector2(-2,11)*scale,3*scale);Line(mesh,new Vector2(-2,11)*scale,new Vector2(7,9)*scale,2*scale);}
            else if(Kind=="weapon"){Line(mesh,new Vector2(-11,3)*scale,new Vector2(11,3)*scale,4*scale);Line(mesh,new Vector2(-7,2)*scale,new Vector2(-7,-6)*scale,4*scale);Line(mesh,new Vector2(0,2)*scale,new Vector2(2,-7)*scale,3*scale);}
            else if(Kind=="move"){Ring(mesh,Vector2.zero,12*scale,1*scale);Ring(mesh,Vector2.zero,5*scale,2*scale);}
            else if(Kind=="menu"){for(int i=-1;i<=1;i++)Line(mesh,new Vector2(-9,i*6)*scale,new Vector2(9,i*6)*scale,2*scale);}
        }
        void Line(VertexHelper mesh,Vector2 from,Vector2 to,float width)
        {var side=new Vector2(-(to-from).y,(to-from).x).normalized*width*.5f;int i=mesh.currentVertCount;mesh.AddVert(from-side,color,Vector2.zero);mesh.AddVert(from+side,color,Vector2.zero);mesh.AddVert(to+side,color,Vector2.zero);mesh.AddVert(to-side,color,Vector2.zero);mesh.AddTriangle(i,i+1,i+2);mesh.AddTriangle(i,i+2,i+3);}
        void Ring(VertexHelper mesh,Vector2 center,float radius,float width)
        {for(int i=0;i<48;i++){float a=i*Mathf.PI/24,b=(i+1)*Mathf.PI/24;Line(mesh,center+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*radius,center+new Vector2(Mathf.Cos(b),Mathf.Sin(b))*radius,width);}}
    }
}
