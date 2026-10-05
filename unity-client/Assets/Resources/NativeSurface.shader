Shader "Sector16/Surface"
{
    Properties { _Color("Color", Color) = (1,1,1,1) }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        Pass
        {
            Tags { "LightMode"="ForwardBase" }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            #include "Lighting.cginc"
            fixed4 _Color;
            struct Vertex { float4 vertex:POSITION; float3 normal:NORMAL; };
            struct Fragment { float4 vertex:SV_POSITION; float3 normal:TEXCOORD0; };
            Fragment vert(Vertex v)
            {
                Fragment o;o.vertex=UnityObjectToClipPos(v.vertex);o.normal=UnityObjectToWorldNormal(v.normal);return o;
            }
            fixed4 frag(Fragment i):SV_Target
            {
                float sunlight=max(0,dot(normalize(i.normal),normalize(_WorldSpaceLightPos0.xyz)));
                return fixed4(_Color.rgb*(.45+.55*sunlight)*_LightColor0.rgb,1);
            }
            ENDCG
        }
    }
}
