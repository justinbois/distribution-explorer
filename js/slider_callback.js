// The code below assumes that dist is an instance of a 
// ContinuousUnivariateDistribution class and that all necessary
// functions and classes have been loaded.

// Don't trigger for disabled sliders
if (triggerCallbacks.active && !cb_obj.disabled) {
	if (quantileSetterSwitch.active) {
		quantileSetter(xBoxes, pBoxes, quantileSetterDiv, sliders, startBoxes, endBoxes, p_p, p_c, source_p);
	}
	else {
		updateData(source_p, source_c, p_p, sliders, discrete);
		updateQuantiles(quantileSetterSwitch, sliders, xBoxes, pBoxes);
	}
}