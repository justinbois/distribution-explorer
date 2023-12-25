// The code below assumes that dist is an instance of a 
// ContinuousUnivariateDistribution class and that all necessary
// functions and classes have been loaded.

// Extract data from sources
let x_p = source_p.data['x'];
let y_p = source_p.data['y_p'];
let x_c = source_c.data['x'];
let y_c = source_c.data['y_c'];
let xRangeMin = xRange.start;
let xRangeMax = xRange.end;

// x-values to evaluate PDF and CDF
x_p = linspace(xRangeMin, xRangeMax, n);
x_c = x_p;

// Update sources with new x-values
source_p.data['x'] = x_p;
source_c.data['x'] = x_c;

// Obtain parameter values
let params = paramsFromSliders(sliders);

// Update the PDF and CDF
source_p.data['y_p'] = dist.pdf(x_p, params);
source_c.data['y_c'] = dist.cdf(x_c, params);

// Update quantiles
// This does not have to happen for x-axis range changes, but
// we do it in this callback anyway because it's not expensive.
if (!quantileSetterSwitch.active) {
	for (let i = 0; i < xBoxes.length; i++) {
		xBoxes[i].value = dist.ppfSingleValue(Number(pBoxes[i].value), params).toPrecision(4);
	}
}

source_p.change.emit();
source_c.change.emit();