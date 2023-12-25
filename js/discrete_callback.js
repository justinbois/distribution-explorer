// The code below assumes that dist is an instance of a 
// DiscreteUnivariateDistribution class and that all necessary
// functions and classes have been loaded.

// Extract data range
let xRangeMin = Math.floor(xRange.start);
let xRangeMax = Math.ceil(xRange.end);

// x-values to evaluate PMF and CDF
let x_p = arange(xRangeMin, xRangeMax + 1);

// Set up x-values for plotting the staircase CDF
let x_c = [xRangeMin - 1, ...x_p.flatMap(x => [x, x]), xRangeMax + 1];

// Update sources with new x-values
source_p.data['x'] = x_p;
source_c.data['x'] = x_c;

// Obtain parameter values
let params = paramsFromSliders(sliders);

// Update the PMF and CDF
source_p.data['y_p'] = dist.pmf(x_p, params);
source_c.data['y_c'] = dist.cdfForPlotting(x_c[0], x_c[x_c.length - 1], params, dist.xMin(params));

source_p.change.emit();
source_c.change.emit();