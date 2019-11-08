// Extract data from sources
var data_p = source_p.data;
var data_c = source_c.data;
var x_p = data_p['x'];
var y_p = data_p['y_p'];
var x_c = data_c['x'];
var y_c = data_c['y_c'];
var xRangeMin = xrange.start;
var xRangeMax = xrange.end;

// Make corrections for start and end points based on support
if (dist == 'lognormal' 
    || dist == 'gamma' 
    || dist == 'exponential' 
    || dist == 'inv_gamma'
    || dist == 'weibull') {
	xRangeMin = 0.0;
}
else if (dist == 'beta') { 
    xRangeMin = 0.0;
    xRangeMax = 1.0;
}

// x-values to evaluate PDF and CDF
x_p = linspace(xRangeMin, xRangeMax, n);
x_c = x_p;

// Update sources with new x-values
source_p.data['x'] = x_p;
source_c.data['x'] = x_c;

// Update the PDF and CDF
source_p.data['y_p'] = update_y_p(probFun, 
    x_p, arg1.value, arg2.value, arg3.value);
source_c.data['y_c'] = update_y_c_continuous(cdfFun, 
    x_c, arg1.value, arg2.value, arg3.value);

source_p.change.emit();
source_c.change.emit();