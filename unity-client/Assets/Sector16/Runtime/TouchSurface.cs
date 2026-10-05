using UnityEngine;
using UnityEngine.EventSystems;

namespace Sector16
{
    public sealed class TouchSurface : MonoBehaviour,IPointerDownHandler,IDragHandler,IPointerUpHandler
    {
        public NativeControls Owner;
        public string Control;
        int? pointer;
        Vector2 previous;
        public void Clear(){pointer=null;}
        public void OnPointerDown(PointerEventData e)
        {
            if(pointer.HasValue||!Owner.Gameplay)return;
            if(!Owner.Allowed(Control))return;
            pointer=e.pointerId;previous=e.position;e.useDragThreshold=false;Owner.Hold(Control,true);
            if(Control=="move")Move(e);
        }
        public void OnDrag(PointerEventData e)
        {
            if(pointer!=e.pointerId||!Owner.Gameplay)return;
            if(Control=="move")Move(e);
            else if(Control=="look"||Control=="fire")Owner.Look(e.position-previous);
            previous=e.position;
        }
        void Move(PointerEventData e)
        {
            var rect=(RectTransform)transform;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(rect,e.position,e.pressEventCamera,out var local);
            Owner.Move(local/(rect.rect.width*.35f));
        }
        public void OnPointerUp(PointerEventData e)
        {
            if(pointer!=e.pointerId)return;pointer=null;Owner.Hold(Control,false);
        }
        void OnDisable(){if(Owner!=null)Owner.Hold(Control,false);Clear();}
    }
}
