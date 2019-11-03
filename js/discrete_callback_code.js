// Extract data from sources
var data_p = source_p.data;
var data_c = source_c.data;
var x_p = data_p['x'];
var y_p = data_p['y_p'];
var x_c = data_c['x'];
var y_c = data_c['y_c'];
var xRangeMin = xrange.start;
var xRangeMax = xrange.end;

// Make corrections for start and end points for discrete distributions
if (dist == 'bernoulli' || dist == 'beta') {
	xRangeMin = 0.0;
	xRangeMax = 1.0;
}
else if (dist == 'categorical') {
	xRangeMin = 1;
	xRangeMax = x_p.length;
}
else {
  	xRangeMin = Math.max(0, Math.floor(xRangeMin));
	xRangeMax = Math.floor(xRangeMax);
}

// x-values to evaluate PMF and CDF
x_p = arange(xRangeMin, xRangeMax+1);
xSize = xRangeMax - xRangeMin;

x_c = [];
for (var i = 0; i < x_p.length; i++) x_c.push(x_p[i], x_p[i]);

x_c.unshift(Math.max(xRangeMin - 0.05 * xSize, xRangeMin - 0.95));
x_c.push(Math.min(xRangeMax + 0.05 * xSize, xRangeMax + 0.95));

// Update sources with new x-values
source_p.data['x'] = x_p;
source_c.data['x'] = x_c;

// Update the PMF and CDF
source_p.data['y_p'] = update_y_p(probFun, 
    x_p, arg1.value, arg2.value, arg3.value);
source_c.data['y_c'] = update_y_c_discrete(probFun, 
	x_c, source_p.data['y_p'], arg1.value, arg2.value, arg3.value);

source_p.change.emit();
source_c.change.emit();