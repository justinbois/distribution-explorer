// Args for this callback is a slider that takes integer values and maxValue. 
// cb_obj is the text box for the end value.
slider.end = Math.min(Math.floor(maxValue), Math.floor(Number(cb_obj.value)));