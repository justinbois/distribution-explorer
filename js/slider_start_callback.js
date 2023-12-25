// Arg for this callback is a slider and minValue. cb_obj is the text box for the start value.
slider.start = Math.max(minValue, Number(cb_obj.value));
slider.step = (slider.end - slider.start) / 1000;