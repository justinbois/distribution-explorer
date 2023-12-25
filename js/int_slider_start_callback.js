// Args for this callback is a slider that takes integer values and minValue. 
// cb_obj is the text box for the start value.
slider.start = Math.max(Math.floor(minValue), Math.floor(Number(cb_obj.value)));