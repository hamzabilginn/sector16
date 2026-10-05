Shader "Sector16/Surface"
{
    Properties { _Color("Color", Color) = (1,1,1,1) _MainTex("Texture",2D)="white"{} _Gloss("Gloss",Range(0,1))=.2 _Metallic("Metal",Range(0,1))=0 _Unlit("Unlit",Float)=0 _Cull("Cull",Float)=2 _ZWrite("Depth write",Float)=1 }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        Pass
        {
            Tags { "LightMode"="ForwardBase" }
            Cull [_Cull]
            ZWrite [_ZWrite]
            Blend SrcAlpha OneMinusSrcAlpha
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog
            #pragma multi_compile_fwdbase
            #include "UnityCG.cginc"
            #include "Lighting.cginc"
            #include "AutoLight.cginc"
            fixed4 _Color;sampler2D _MainTex;float4 _MainTex_ST;float _Gloss,_Metallic,_Unlit;
            struct Vertex { float4 vertex:POSITION; float3 normal:NORMAL; float2 uv:TEXCOORD0; };
            struct Fragment { float4 pos:SV_POSITION; float3 normal:TEXCOORD0;float2 uv:TEXCOORD1;float3 world:TEXCOORD2;UNITY_FOG_COORDS(3) SHADOW_COORDS(4) };
            Fragment vert(Vertex v)
            {
                Fragment o;o.pos=UnityObjectToClipPos(v.vertex);o.normal=UnityObjectToWorldNormal(v.normal);o.uv=TRANSFORM_TEX(v.uv,_MainTex);o.world=mul(unity_ObjectToWorld,v.vertex).xyz;UNITY_TRANSFER_FOG(o,o.pos);TRANSFER_SHADOW(o);return o;
            }
            fixed4 frag(Fragment i):SV_Target
            {
                fixed4 albedo=tex2D(_MainTex,i.uv)*_Color;
                float3 n=normalize(i.normal),light=normalize(_WorldSpaceLightPos0.xyz),view=normalize(_WorldSpaceCameraPos-i.world);
                float sunlight=max(0,dot(n,light))*SHADOW_ATTENUATION(i);
                float spec=pow(max(0,dot(n,normalize(light+view))),lerp(8,96,_Gloss))*_Gloss;
                float3 lit=albedo.rgb*(.38+.62*sunlight)*_LightColor0.rgb+spec*lerp(.06,albedo.rgb,_Metallic);
                fixed4 result=fixed4(lerp(lit,albedo.rgb,_Unlit),albedo.a);UNITY_APPLY_FOG(i.fogCoord,result);return result;
            }
            ENDCG
        }
        UsePass "Legacy Shaders/VertexLit/SHADOWCASTER"
    }
}
