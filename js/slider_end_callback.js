// Arg for this callback is a slider and maxValue. cb_obj is the text box for the end value.
slider.end = Math.min(maxValue, Number(cb_obj.value));
slider.step = (slider.end - slider.start) / 1000;