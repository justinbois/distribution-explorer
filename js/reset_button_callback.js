// The code below assumes that dist is an instance of a 
// ContinuousUnivariateDistribution class or of a
// DiscreteUnivariateDistribution and that all necessary
// functions and classes have been loaded.

// Obtain parameter values
let params = paramsFromSliders(sliders); 

// Obtain limits of x-axis
let [x1, x2] = dist.defaultXRange(params);

// Set the new x_range if it changed. This will trigger recalculation of PDF/PMF and CDF
// via the callback linked to the x_range.
if (p_p.x_range.start != x1 && p_p.x_range.end != x2) {
  p_p.x_range.start = x1;
  p_p.x_range.end = x2;
}

// Set y-ranges to the defaults
setYRanges(p_p, p_c, source_p);  
