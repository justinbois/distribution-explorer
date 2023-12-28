// The code below assumes that dist is an instance of a 
// ContinuousUnivariateDistribution class or of a
// DiscreteUnivariateDistribution and that all necessary
// functions and classes have been loaded.

// Obtain parameter values
let params = paramsFromSliders(sliders); 

// Obtain limits of x-axis
let [x1, x2] = dist.defaultXRange(params);

// Do not trigger xaxis callback
triggerCallbacks.active = false;

// Set the new x_range.
p_p.x_range.start = x1;
p_p.x_range.end = x2;

updateData(source_p, source_c, p_p, sliders, discrete);

// Set y-ranges to the defaults
setYRanges(p_p, p_c, source_p);  

// Turn triggers back on (This strategy may not even work, since the xaxis callback is listening
// for a change, and the switching off and on of the triggerCallback switch may happed faster than
// the refresh rate.)
triggerCallbacks.active = true;
