start = """
    slider.start = Math.max(min_value, Number(cb_obj.value));
"""

end = """
slider.end = Math.min(max_value, Number(cb_obj.value));
"""

start_int = """
slider.start = Math.max(Math.floor(min_value), Math.floor(Number(cb_obj.value)));
"""

end_int = """
slider.end = Math.min(Math.floor(max_value), Math.floor(Number(cb_obj.value)));
"""

bernoulli_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function probFun(x, theta, {}, {}) {
	if (x == 0) return 1 - theta;
	else if (x == 1) return theta;
	else return NaN;
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

binomial_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function lnchoice(n, k) {
    return lnfactorial(n) - lnfactorial(n-k) - lnfactorial(k);
}



function lnfactorial(n) {
  if (n > 254) { // Use Stirling's approximation
    var x = n + 1;
    return (x - 0.5)*Math.log(x) - x + 0.5*Math.log(2*Math.PI) + 1.0/(12.0*x);
  }
  else { // Look it up
    const lnfact = [0.000000000000000,
                    0.000000000000000,
                    0.693147180559945,
                    1.791759469228055,
                    3.178053830347946,
                    4.787491742782046,
                    6.579251212010101,
                    8.525161361065415,
                    10.604602902745251,
                    12.801827480081469,
                    15.104412573075516,
                    17.502307845873887,
                    19.987214495661885,
                    22.552163853123421,
                    25.191221182738683,
                    27.899271383840894,
                    30.671860106080675,
                    33.505073450136891,
                    36.395445208033053,
                    39.339884187199495,
                    42.335616460753485,
                    45.380138898476908,
                    48.471181351835227,
                    51.606675567764377,
                    54.784729398112319,
                    58.003605222980518,
                    61.261701761002001,
                    64.557538627006323,
                    67.889743137181526,
                    71.257038967168000,
                    74.658236348830158,
                    78.092223553315307,
                    81.557959456115029,
                    85.054467017581516,
                    88.580827542197682,
                    92.136175603687079,
                    95.719694542143202,
                    99.330612454787428,
                    102.968198614513810,
                    106.631760260643450,
                    110.320639714757390,
                    114.034211781461690,
                    117.771881399745060,
                    121.533081515438640,
                    125.317271149356880,
                    129.123933639127240,
                    132.952575035616290,
                    136.802722637326350,
                    140.673923648234250,
                    144.565743946344900,
                    148.477766951773020,
                    152.409592584497350,
                    156.360836303078800,
                    160.331128216630930,
                    164.320112263195170,
                    168.327445448427650,
                    172.352797139162820,
                    176.395848406997370,
                    180.456291417543780,
                    184.533828861449510,
                    188.628173423671600,
                    192.739047287844900,
                    196.866181672889980,
                    201.009316399281570,
                    205.168199482641200,
                    209.342586752536820,
                    213.532241494563270,
                    217.736934113954250,
                    221.956441819130360,
                    226.190548323727570,
                    230.439043565776930,
                    234.701723442818260,
                    238.978389561834350,
                    243.268849002982730,
                    247.572914096186910,
                    251.890402209723190,
                    256.221135550009480,
                    260.564940971863220,
                    264.921649798552780,
                    269.291097651019810,
                    273.673124285693690,
                    278.067573440366120,
                    282.474292687630400,
                    286.893133295426990,
                    291.323950094270290,
                    295.766601350760600,
                    300.220948647014100,
                    304.686856765668720,
                    309.164193580146900,
                    313.652829949878990,
                    318.152639620209300,
                    322.663499126726210,
                    327.185287703775200,
                    331.717887196928470,
                    336.261181979198450,
                    340.815058870798960,
                    345.379407062266860,
                    349.954118040770250,
                    354.539085519440790,
                    359.134205369575340,
                    363.739375555563470,
                    368.354496072404690,
                    372.979468885689020,
                    377.614197873918670,
                    382.258588773060010,
                    386.912549123217560,
                    391.575988217329610,
                    396.248817051791490,
                    400.930948278915760,
                    405.622296161144900,
                    410.322776526937280,
                    415.032306728249580,
                    419.750805599544780,
                    424.478193418257090,
                    429.214391866651570,
                    433.959323995014870,
                    438.712914186121170,
                    443.475088120918940,
                    448.245772745384610,
                    453.024896238496130,
                    457.812387981278110,
                    462.608178526874890,
                    467.412199571608080,
                    472.224383926980520,
                    477.044665492585580,
                    481.872979229887900,
                    486.709261136839360,
                    491.553448223298010,
                    496.405478487217580,
                    501.265290891579240,
                    506.132825342034830,
                    511.008022665236070,
                    515.890824587822520,
                    520.781173716044240,
                    525.679013515995050,
                    530.584288294433580,
                    535.496943180169520,
                    540.416924105997740,
                    545.344177791154950,
                    550.278651724285620,
                    555.220294146894960,
                    560.169054037273100,
                    565.124881094874350,
                    570.087725725134190,
                    575.057539024710200,
                    580.034272767130800,
                    585.017879388839220,
                    590.008311975617860,
                    595.005524249382010,
                    600.009470555327430,
                    605.020105849423770,
                    610.037385686238740,
                    615.061266207084940,
                    620.091704128477430,
                    625.128656730891070,
                    630.172081847810200,
                    635.221937855059760,
                    640.278183660408100,
                    645.340778693435030,
                    650.409682895655240,
                    655.484856710889060,
                    660.566261075873510,
                    665.653857411105950,
                    670.747607611912710,
                    675.847474039736880,
                    680.953419513637530,
                    686.065407301994010,
                    691.183401114410800,
                    696.307365093814040,
                    701.437263808737160,
                    706.573062245787470,
                    711.714725802289990,
                    716.862220279103440,
                    722.015511873601330,
                    727.174567172815840,
                    732.339353146739310,
                    737.509837141777440,
                    742.685986874351220,
                    747.867770424643370,
                    753.055156230484160,
                    758.248113081374300,
                    763.446610112640200,
                    768.650616799717000,
                    773.860102952558460,
                    779.075038710167410,
                    784.295394535245690,
                    789.521141208958970,
                    794.752249825813460,
                    799.988691788643450,
                    805.230438803703120,
                    810.477462875863580,
                    815.729736303910160,
                    820.987231675937890,
                    826.249921864842800,
                    831.517780023906310,
                    836.790779582469900,
                    842.068894241700490,
                    847.352097970438420,
                    852.640365001133090,
                    857.933669825857460,
                    863.231987192405430,
                    868.535292100464630,
                    873.843559797865740,
                    879.156765776907600,
                    884.474885770751830,
                    889.797895749890240,
                    895.125771918679900,
                    900.458490711945270,
                    905.796028791646340,
                    911.138363043611210,
                    916.485470574328820,
                    921.837328707804890,
                    927.193914982476710,
                    932.555207148186240,
                    937.921183163208070,
                    943.291821191335660,
                    948.667099599019820,
                    954.046996952560450,
                    959.431492015349480,
                    964.820563745165940,
                    970.214191291518320,
                    975.612353993036210,
                    981.015031374908400,
                    986.422203146368590,
                    991.833849198223450,
                    997.249949600427840,
                    1002.670484599700300,
                    1008.095434617181700,
                    1013.524780246136200,
                    1018.958502249690200,
                    1024.396581558613400,
                    1029.838999269135500,
                    1035.285736640801600,
                    1040.736775094367400,
                    1046.192096209724900,
                    1051.651681723869200,
                    1057.115513528895000,
                    1062.583573670030100,
                    1068.055844343701400,
                    1073.532307895632800,
                    1079.012946818975000,
                    1084.497743752465600,
                    1089.986681478622400,
                    1095.479742921962700,
                    1100.976911147256000,
                    1106.478169357800900,
                    1111.983500893733000,
                    1117.492889230361000,
                    1123.006317976526100,
                    1128.523770872990800,
                    1134.045231790853000,
                    1139.570684729984800,
                    1145.100113817496100,
                    1150.633503306223700,
                    1156.170837573242400];
    return lnfact[n];
  }
}



function probFun(n, N, theta, {}) {
    if (n > N || n < 0) return NaN;

    if (theta == 0) {
        if (n == 0) return 1.0;
        return 0.0;
    }

    if (theta == 1) {
        if (n == N) return 1.0;
        return 0.0;
    }

    return Math.exp(lnchoice(N, n)
                    + n * Math.log(theta)
                    + (N - n) * Math.log(1-theta));
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

categorical_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function probFun(cat, theta1, theta2, theta3) {
    var theta4 = 1 - theta1 - theta2 - theta3
    if (theta4 < 0) return 0.0;
    if (![1, 2, 3, 4].includes(cat)) return NaN;

    var probs = [theta1, theta2, theta3, theta4]

    return probs[cat-1];
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

discrete_uniform_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function probFun(n, low, high, {}) {
    if (low > high || n < low || n > high) return NaN;

    return 1 / (high - low + 1);
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

geometric_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function probFun(x, theta, {}, {}) {
	if (theta == 1) {
		if (x == 0) return 1.0;
		return 0.0;
	}

    if (theta == 0) return 0.0;

    if (x < 0) return NaN;

	return Math.exp(x * Math.log(1-theta) + Math.log(theta));
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

hypergeometric_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function lnchoice(n, k) {
    return lnfactorial(n) - lnfactorial(n-k) - lnfactorial(k);
}



function lnfactorial(n) {
  if (n > 254) { // Use Stirling's approximation
    var x = n + 1;
    return (x - 0.5)*Math.log(x) - x + 0.5*Math.log(2*Math.PI) + 1.0/(12.0*x);
  }
  else { // Look it up
    const lnfact = [0.000000000000000,
                    0.000000000000000,
                    0.693147180559945,
                    1.791759469228055,
                    3.178053830347946,
                    4.787491742782046,
                    6.579251212010101,
                    8.525161361065415,
                    10.604602902745251,
                    12.801827480081469,
                    15.104412573075516,
                    17.502307845873887,
                    19.987214495661885,
                    22.552163853123421,
                    25.191221182738683,
                    27.899271383840894,
                    30.671860106080675,
                    33.505073450136891,
                    36.395445208033053,
                    39.339884187199495,
                    42.335616460753485,
                    45.380138898476908,
                    48.471181351835227,
                    51.606675567764377,
                    54.784729398112319,
                    58.003605222980518,
                    61.261701761002001,
                    64.557538627006323,
                    67.889743137181526,
                    71.257038967168000,
                    74.658236348830158,
                    78.092223553315307,
                    81.557959456115029,
                    85.054467017581516,
                    88.580827542197682,
                    92.136175603687079,
                    95.719694542143202,
                    99.330612454787428,
                    102.968198614513810,
                    106.631760260643450,
                    110.320639714757390,
                    114.034211781461690,
                    117.771881399745060,
                    121.533081515438640,
                    125.317271149356880,
                    129.123933639127240,
                    132.952575035616290,
                    136.802722637326350,
                    140.673923648234250,
                    144.565743946344900,
                    148.477766951773020,
                    152.409592584497350,
                    156.360836303078800,
                    160.331128216630930,
                    164.320112263195170,
                    168.327445448427650,
                    172.352797139162820,
                    176.395848406997370,
                    180.456291417543780,
                    184.533828861449510,
                    188.628173423671600,
                    192.739047287844900,
                    196.866181672889980,
                    201.009316399281570,
                    205.168199482641200,
                    209.342586752536820,
                    213.532241494563270,
                    217.736934113954250,
                    221.956441819130360,
                    226.190548323727570,
                    230.439043565776930,
                    234.701723442818260,
                    238.978389561834350,
                    243.268849002982730,
                    247.572914096186910,
                    251.890402209723190,
                    256.221135550009480,
                    260.564940971863220,
                    264.921649798552780,
                    269.291097651019810,
                    273.673124285693690,
                    278.067573440366120,
                    282.474292687630400,
                    286.893133295426990,
                    291.323950094270290,
                    295.766601350760600,
                    300.220948647014100,
                    304.686856765668720,
                    309.164193580146900,
                    313.652829949878990,
                    318.152639620209300,
                    322.663499126726210,
                    327.185287703775200,
                    331.717887196928470,
                    336.261181979198450,
                    340.815058870798960,
                    345.379407062266860,
                    349.954118040770250,
                    354.539085519440790,
                    359.134205369575340,
                    363.739375555563470,
                    368.354496072404690,
                    372.979468885689020,
                    377.614197873918670,
                    382.258588773060010,
                    386.912549123217560,
                    391.575988217329610,
                    396.248817051791490,
                    400.930948278915760,
                    405.622296161144900,
                    410.322776526937280,
                    415.032306728249580,
                    419.750805599544780,
                    424.478193418257090,
                    429.214391866651570,
                    433.959323995014870,
                    438.712914186121170,
                    443.475088120918940,
                    448.245772745384610,
                    453.024896238496130,
                    457.812387981278110,
                    462.608178526874890,
                    467.412199571608080,
                    472.224383926980520,
                    477.044665492585580,
                    481.872979229887900,
                    486.709261136839360,
                    491.553448223298010,
                    496.405478487217580,
                    501.265290891579240,
                    506.132825342034830,
                    511.008022665236070,
                    515.890824587822520,
                    520.781173716044240,
                    525.679013515995050,
                    530.584288294433580,
                    535.496943180169520,
                    540.416924105997740,
                    545.344177791154950,
                    550.278651724285620,
                    555.220294146894960,
                    560.169054037273100,
                    565.124881094874350,
                    570.087725725134190,
                    575.057539024710200,
                    580.034272767130800,
                    585.017879388839220,
                    590.008311975617860,
                    595.005524249382010,
                    600.009470555327430,
                    605.020105849423770,
                    610.037385686238740,
                    615.061266207084940,
                    620.091704128477430,
                    625.128656730891070,
                    630.172081847810200,
                    635.221937855059760,
                    640.278183660408100,
                    645.340778693435030,
                    650.409682895655240,
                    655.484856710889060,
                    660.566261075873510,
                    665.653857411105950,
                    670.747607611912710,
                    675.847474039736880,
                    680.953419513637530,
                    686.065407301994010,
                    691.183401114410800,
                    696.307365093814040,
                    701.437263808737160,
                    706.573062245787470,
                    711.714725802289990,
                    716.862220279103440,
                    722.015511873601330,
                    727.174567172815840,
                    732.339353146739310,
                    737.509837141777440,
                    742.685986874351220,
                    747.867770424643370,
                    753.055156230484160,
                    758.248113081374300,
                    763.446610112640200,
                    768.650616799717000,
                    773.860102952558460,
                    779.075038710167410,
                    784.295394535245690,
                    789.521141208958970,
                    794.752249825813460,
                    799.988691788643450,
                    805.230438803703120,
                    810.477462875863580,
                    815.729736303910160,
                    820.987231675937890,
                    826.249921864842800,
                    831.517780023906310,
                    836.790779582469900,
                    842.068894241700490,
                    847.352097970438420,
                    852.640365001133090,
                    857.933669825857460,
                    863.231987192405430,
                    868.535292100464630,
                    873.843559797865740,
                    879.156765776907600,
                    884.474885770751830,
                    889.797895749890240,
                    895.125771918679900,
                    900.458490711945270,
                    905.796028791646340,
                    911.138363043611210,
                    916.485470574328820,
                    921.837328707804890,
                    927.193914982476710,
                    932.555207148186240,
                    937.921183163208070,
                    943.291821191335660,
                    948.667099599019820,
                    954.046996952560450,
                    959.431492015349480,
                    964.820563745165940,
                    970.214191291518320,
                    975.612353993036210,
                    981.015031374908400,
                    986.422203146368590,
                    991.833849198223450,
                    997.249949600427840,
                    1002.670484599700300,
                    1008.095434617181700,
                    1013.524780246136200,
                    1018.958502249690200,
                    1024.396581558613400,
                    1029.838999269135500,
                    1035.285736640801600,
                    1040.736775094367400,
                    1046.192096209724900,
                    1051.651681723869200,
                    1057.115513528895000,
                    1062.583573670030100,
                    1068.055844343701400,
                    1073.532307895632800,
                    1079.012946818975000,
                    1084.497743752465600,
                    1089.986681478622400,
                    1095.479742921962700,
                    1100.976911147256000,
                    1106.478169357800900,
                    1111.983500893733000,
                    1117.492889230361000,
                    1123.006317976526100,
                    1128.523770872990800,
                    1134.045231790853000,
                    1139.570684729984800,
                    1145.100113817496100,
                    1150.633503306223700,
                    1156.170837573242400];
    return lnfact[n];
  }
}



function probFun(n, N, a, b) {
    if (n < Math.max(0, N-b) || n > Math.min(N, a)) return NaN;

    return Math.exp(lnchoice(a, n) + lnchoice(b, N-n) - lnchoice(a+b, N));
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

negative_binomial_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function lnfactorial(n) {
  if (n > 254) { // Use Stirling's approximation
    var x = n + 1;
    return (x - 0.5)*Math.log(x) - x + 0.5*Math.log(2*Math.PI) + 1.0/(12.0*x);
  }
  else { // Look it up
    const lnfact = [0.000000000000000,
                    0.000000000000000,
                    0.693147180559945,
                    1.791759469228055,
                    3.178053830347946,
                    4.787491742782046,
                    6.579251212010101,
                    8.525161361065415,
                    10.604602902745251,
                    12.801827480081469,
                    15.104412573075516,
                    17.502307845873887,
                    19.987214495661885,
                    22.552163853123421,
                    25.191221182738683,
                    27.899271383840894,
                    30.671860106080675,
                    33.505073450136891,
                    36.395445208033053,
                    39.339884187199495,
                    42.335616460753485,
                    45.380138898476908,
                    48.471181351835227,
                    51.606675567764377,
                    54.784729398112319,
                    58.003605222980518,
                    61.261701761002001,
                    64.557538627006323,
                    67.889743137181526,
                    71.257038967168000,
                    74.658236348830158,
                    78.092223553315307,
                    81.557959456115029,
                    85.054467017581516,
                    88.580827542197682,
                    92.136175603687079,
                    95.719694542143202,
                    99.330612454787428,
                    102.968198614513810,
                    106.631760260643450,
                    110.320639714757390,
                    114.034211781461690,
                    117.771881399745060,
                    121.533081515438640,
                    125.317271149356880,
                    129.123933639127240,
                    132.952575035616290,
                    136.802722637326350,
                    140.673923648234250,
                    144.565743946344900,
                    148.477766951773020,
                    152.409592584497350,
                    156.360836303078800,
                    160.331128216630930,
                    164.320112263195170,
                    168.327445448427650,
                    172.352797139162820,
                    176.395848406997370,
                    180.456291417543780,
                    184.533828861449510,
                    188.628173423671600,
                    192.739047287844900,
                    196.866181672889980,
                    201.009316399281570,
                    205.168199482641200,
                    209.342586752536820,
                    213.532241494563270,
                    217.736934113954250,
                    221.956441819130360,
                    226.190548323727570,
                    230.439043565776930,
                    234.701723442818260,
                    238.978389561834350,
                    243.268849002982730,
                    247.572914096186910,
                    251.890402209723190,
                    256.221135550009480,
                    260.564940971863220,
                    264.921649798552780,
                    269.291097651019810,
                    273.673124285693690,
                    278.067573440366120,
                    282.474292687630400,
                    286.893133295426990,
                    291.323950094270290,
                    295.766601350760600,
                    300.220948647014100,
                    304.686856765668720,
                    309.164193580146900,
                    313.652829949878990,
                    318.152639620209300,
                    322.663499126726210,
                    327.185287703775200,
                    331.717887196928470,
                    336.261181979198450,
                    340.815058870798960,
                    345.379407062266860,
                    349.954118040770250,
                    354.539085519440790,
                    359.134205369575340,
                    363.739375555563470,
                    368.354496072404690,
                    372.979468885689020,
                    377.614197873918670,
                    382.258588773060010,
                    386.912549123217560,
                    391.575988217329610,
                    396.248817051791490,
                    400.930948278915760,
                    405.622296161144900,
                    410.322776526937280,
                    415.032306728249580,
                    419.750805599544780,
                    424.478193418257090,
                    429.214391866651570,
                    433.959323995014870,
                    438.712914186121170,
                    443.475088120918940,
                    448.245772745384610,
                    453.024896238496130,
                    457.812387981278110,
                    462.608178526874890,
                    467.412199571608080,
                    472.224383926980520,
                    477.044665492585580,
                    481.872979229887900,
                    486.709261136839360,
                    491.553448223298010,
                    496.405478487217580,
                    501.265290891579240,
                    506.132825342034830,
                    511.008022665236070,
                    515.890824587822520,
                    520.781173716044240,
                    525.679013515995050,
                    530.584288294433580,
                    535.496943180169520,
                    540.416924105997740,
                    545.344177791154950,
                    550.278651724285620,
                    555.220294146894960,
                    560.169054037273100,
                    565.124881094874350,
                    570.087725725134190,
                    575.057539024710200,
                    580.034272767130800,
                    585.017879388839220,
                    590.008311975617860,
                    595.005524249382010,
                    600.009470555327430,
                    605.020105849423770,
                    610.037385686238740,
                    615.061266207084940,
                    620.091704128477430,
                    625.128656730891070,
                    630.172081847810200,
                    635.221937855059760,
                    640.278183660408100,
                    645.340778693435030,
                    650.409682895655240,
                    655.484856710889060,
                    660.566261075873510,
                    665.653857411105950,
                    670.747607611912710,
                    675.847474039736880,
                    680.953419513637530,
                    686.065407301994010,
                    691.183401114410800,
                    696.307365093814040,
                    701.437263808737160,
                    706.573062245787470,
                    711.714725802289990,
                    716.862220279103440,
                    722.015511873601330,
                    727.174567172815840,
                    732.339353146739310,
                    737.509837141777440,
                    742.685986874351220,
                    747.867770424643370,
                    753.055156230484160,
                    758.248113081374300,
                    763.446610112640200,
                    768.650616799717000,
                    773.860102952558460,
                    779.075038710167410,
                    784.295394535245690,
                    789.521141208958970,
                    794.752249825813460,
                    799.988691788643450,
                    805.230438803703120,
                    810.477462875863580,
                    815.729736303910160,
                    820.987231675937890,
                    826.249921864842800,
                    831.517780023906310,
                    836.790779582469900,
                    842.068894241700490,
                    847.352097970438420,
                    852.640365001133090,
                    857.933669825857460,
                    863.231987192405430,
                    868.535292100464630,
                    873.843559797865740,
                    879.156765776907600,
                    884.474885770751830,
                    889.797895749890240,
                    895.125771918679900,
                    900.458490711945270,
                    905.796028791646340,
                    911.138363043611210,
                    916.485470574328820,
                    921.837328707804890,
                    927.193914982476710,
                    932.555207148186240,
                    937.921183163208070,
                    943.291821191335660,
                    948.667099599019820,
                    954.046996952560450,
                    959.431492015349480,
                    964.820563745165940,
                    970.214191291518320,
                    975.612353993036210,
                    981.015031374908400,
                    986.422203146368590,
                    991.833849198223450,
                    997.249949600427840,
                    1002.670484599700300,
                    1008.095434617181700,
                    1013.524780246136200,
                    1018.958502249690200,
                    1024.396581558613400,
                    1029.838999269135500,
                    1035.285736640801600,
                    1040.736775094367400,
                    1046.192096209724900,
                    1051.651681723869200,
                    1057.115513528895000,
                    1062.583573670030100,
                    1068.055844343701400,
                    1073.532307895632800,
                    1079.012946818975000,
                    1084.497743752465600,
                    1089.986681478622400,
                    1095.479742921962700,
                    1100.976911147256000,
                    1106.478169357800900,
                    1111.983500893733000,
                    1117.492889230361000,
                    1123.006317976526100,
                    1128.523770872990800,
                    1134.045231790853000,
                    1139.570684729984800,
                    1145.100113817496100,
                    1150.633503306223700,
                    1156.170837573242400];
    return lnfact[n];
  }
}



function probFun(y, alpha, beta, {}) {
    if (y < 0) return NaN;

    return Math.exp(lngamma(y + alpha)
                    - lngamma(alpha)
                    - lnfactorial(y)
                    + alpha * Math.log(beta / (1 + beta))
                    - y * Math.log(1 + beta));
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

negative_binomial_mu_phi_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function lnfactorial(n) {
  if (n > 254) { // Use Stirling's approximation
    var x = n + 1;
    return (x - 0.5)*Math.log(x) - x + 0.5*Math.log(2*Math.PI) + 1.0/(12.0*x);
  }
  else { // Look it up
    const lnfact = [0.000000000000000,
                    0.000000000000000,
                    0.693147180559945,
                    1.791759469228055,
                    3.178053830347946,
                    4.787491742782046,
                    6.579251212010101,
                    8.525161361065415,
                    10.604602902745251,
                    12.801827480081469,
                    15.104412573075516,
                    17.502307845873887,
                    19.987214495661885,
                    22.552163853123421,
                    25.191221182738683,
                    27.899271383840894,
                    30.671860106080675,
                    33.505073450136891,
                    36.395445208033053,
                    39.339884187199495,
                    42.335616460753485,
                    45.380138898476908,
                    48.471181351835227,
                    51.606675567764377,
                    54.784729398112319,
                    58.003605222980518,
                    61.261701761002001,
                    64.557538627006323,
                    67.889743137181526,
                    71.257038967168000,
                    74.658236348830158,
                    78.092223553315307,
                    81.557959456115029,
                    85.054467017581516,
                    88.580827542197682,
                    92.136175603687079,
                    95.719694542143202,
                    99.330612454787428,
                    102.968198614513810,
                    106.631760260643450,
                    110.320639714757390,
                    114.034211781461690,
                    117.771881399745060,
                    121.533081515438640,
                    125.317271149356880,
                    129.123933639127240,
                    132.952575035616290,
                    136.802722637326350,
                    140.673923648234250,
                    144.565743946344900,
                    148.477766951773020,
                    152.409592584497350,
                    156.360836303078800,
                    160.331128216630930,
                    164.320112263195170,
                    168.327445448427650,
                    172.352797139162820,
                    176.395848406997370,
                    180.456291417543780,
                    184.533828861449510,
                    188.628173423671600,
                    192.739047287844900,
                    196.866181672889980,
                    201.009316399281570,
                    205.168199482641200,
                    209.342586752536820,
                    213.532241494563270,
                    217.736934113954250,
                    221.956441819130360,
                    226.190548323727570,
                    230.439043565776930,
                    234.701723442818260,
                    238.978389561834350,
                    243.268849002982730,
                    247.572914096186910,
                    251.890402209723190,
                    256.221135550009480,
                    260.564940971863220,
                    264.921649798552780,
                    269.291097651019810,
                    273.673124285693690,
                    278.067573440366120,
                    282.474292687630400,
                    286.893133295426990,
                    291.323950094270290,
                    295.766601350760600,
                    300.220948647014100,
                    304.686856765668720,
                    309.164193580146900,
                    313.652829949878990,
                    318.152639620209300,
                    322.663499126726210,
                    327.185287703775200,
                    331.717887196928470,
                    336.261181979198450,
                    340.815058870798960,
                    345.379407062266860,
                    349.954118040770250,
                    354.539085519440790,
                    359.134205369575340,
                    363.739375555563470,
                    368.354496072404690,
                    372.979468885689020,
                    377.614197873918670,
                    382.258588773060010,
                    386.912549123217560,
                    391.575988217329610,
                    396.248817051791490,
                    400.930948278915760,
                    405.622296161144900,
                    410.322776526937280,
                    415.032306728249580,
                    419.750805599544780,
                    424.478193418257090,
                    429.214391866651570,
                    433.959323995014870,
                    438.712914186121170,
                    443.475088120918940,
                    448.245772745384610,
                    453.024896238496130,
                    457.812387981278110,
                    462.608178526874890,
                    467.412199571608080,
                    472.224383926980520,
                    477.044665492585580,
                    481.872979229887900,
                    486.709261136839360,
                    491.553448223298010,
                    496.405478487217580,
                    501.265290891579240,
                    506.132825342034830,
                    511.008022665236070,
                    515.890824587822520,
                    520.781173716044240,
                    525.679013515995050,
                    530.584288294433580,
                    535.496943180169520,
                    540.416924105997740,
                    545.344177791154950,
                    550.278651724285620,
                    555.220294146894960,
                    560.169054037273100,
                    565.124881094874350,
                    570.087725725134190,
                    575.057539024710200,
                    580.034272767130800,
                    585.017879388839220,
                    590.008311975617860,
                    595.005524249382010,
                    600.009470555327430,
                    605.020105849423770,
                    610.037385686238740,
                    615.061266207084940,
                    620.091704128477430,
                    625.128656730891070,
                    630.172081847810200,
                    635.221937855059760,
                    640.278183660408100,
                    645.340778693435030,
                    650.409682895655240,
                    655.484856710889060,
                    660.566261075873510,
                    665.653857411105950,
                    670.747607611912710,
                    675.847474039736880,
                    680.953419513637530,
                    686.065407301994010,
                    691.183401114410800,
                    696.307365093814040,
                    701.437263808737160,
                    706.573062245787470,
                    711.714725802289990,
                    716.862220279103440,
                    722.015511873601330,
                    727.174567172815840,
                    732.339353146739310,
                    737.509837141777440,
                    742.685986874351220,
                    747.867770424643370,
                    753.055156230484160,
                    758.248113081374300,
                    763.446610112640200,
                    768.650616799717000,
                    773.860102952558460,
                    779.075038710167410,
                    784.295394535245690,
                    789.521141208958970,
                    794.752249825813460,
                    799.988691788643450,
                    805.230438803703120,
                    810.477462875863580,
                    815.729736303910160,
                    820.987231675937890,
                    826.249921864842800,
                    831.517780023906310,
                    836.790779582469900,
                    842.068894241700490,
                    847.352097970438420,
                    852.640365001133090,
                    857.933669825857460,
                    863.231987192405430,
                    868.535292100464630,
                    873.843559797865740,
                    879.156765776907600,
                    884.474885770751830,
                    889.797895749890240,
                    895.125771918679900,
                    900.458490711945270,
                    905.796028791646340,
                    911.138363043611210,
                    916.485470574328820,
                    921.837328707804890,
                    927.193914982476710,
                    932.555207148186240,
                    937.921183163208070,
                    943.291821191335660,
                    948.667099599019820,
                    954.046996952560450,
                    959.431492015349480,
                    964.820563745165940,
                    970.214191291518320,
                    975.612353993036210,
                    981.015031374908400,
                    986.422203146368590,
                    991.833849198223450,
                    997.249949600427840,
                    1002.670484599700300,
                    1008.095434617181700,
                    1013.524780246136200,
                    1018.958502249690200,
                    1024.396581558613400,
                    1029.838999269135500,
                    1035.285736640801600,
                    1040.736775094367400,
                    1046.192096209724900,
                    1051.651681723869200,
                    1057.115513528895000,
                    1062.583573670030100,
                    1068.055844343701400,
                    1073.532307895632800,
                    1079.012946818975000,
                    1084.497743752465600,
                    1089.986681478622400,
                    1095.479742921962700,
                    1100.976911147256000,
                    1106.478169357800900,
                    1111.983500893733000,
                    1117.492889230361000,
                    1123.006317976526100,
                    1128.523770872990800,
                    1134.045231790853000,
                    1139.570684729984800,
                    1145.100113817496100,
                    1150.633503306223700,
                    1156.170837573242400];
    return lnfact[n];
  }
}



function probFun(y, mu, phi, {}) {
    if (y < 0) return NaN;
    if (mu == 0 | phi == 0) return NaN;

    var logMuPhi = Math.log(mu + phi);

    return Math.exp(lngamma(y + phi)
                    - lngamma(phi)
                    - lnfactorial(y)
                    + phi * (Math.log(phi) - logMuPhi)
                    + y * (Math.log(mu) - logMuPhi));

}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

poisson_callback = """function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}

function discrete_cdf(cumsum, y_p) {
    var y_c = [];

    y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        if (!isNaN(y_p[i])) cumsum += y_p[i];
        y_c.push(cumsum, cumsum);
    }

    return y_c;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0;
    var summand = 0.0;
    for (var i = 0; i < x_p[0]; i++) {
        summand = probFun(x_p[i], arg1, arg2, arg3);
        if (!isNaN(summand)) cumsum += summand;
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}

function lnfactorial(n) {
  if (n > 254) { // Use Stirling's approximation
    var x = n + 1;
    return (x - 0.5)*Math.log(x) - x + 0.5*Math.log(2*Math.PI) + 1.0/(12.0*x);
  }
  else { // Look it up
    const lnfact = [0.000000000000000,
                    0.000000000000000,
                    0.693147180559945,
                    1.791759469228055,
                    3.178053830347946,
                    4.787491742782046,
                    6.579251212010101,
                    8.525161361065415,
                    10.604602902745251,
                    12.801827480081469,
                    15.104412573075516,
                    17.502307845873887,
                    19.987214495661885,
                    22.552163853123421,
                    25.191221182738683,
                    27.899271383840894,
                    30.671860106080675,
                    33.505073450136891,
                    36.395445208033053,
                    39.339884187199495,
                    42.335616460753485,
                    45.380138898476908,
                    48.471181351835227,
                    51.606675567764377,
                    54.784729398112319,
                    58.003605222980518,
                    61.261701761002001,
                    64.557538627006323,
                    67.889743137181526,
                    71.257038967168000,
                    74.658236348830158,
                    78.092223553315307,
                    81.557959456115029,
                    85.054467017581516,
                    88.580827542197682,
                    92.136175603687079,
                    95.719694542143202,
                    99.330612454787428,
                    102.968198614513810,
                    106.631760260643450,
                    110.320639714757390,
                    114.034211781461690,
                    117.771881399745060,
                    121.533081515438640,
                    125.317271149356880,
                    129.123933639127240,
                    132.952575035616290,
                    136.802722637326350,
                    140.673923648234250,
                    144.565743946344900,
                    148.477766951773020,
                    152.409592584497350,
                    156.360836303078800,
                    160.331128216630930,
                    164.320112263195170,
                    168.327445448427650,
                    172.352797139162820,
                    176.395848406997370,
                    180.456291417543780,
                    184.533828861449510,
                    188.628173423671600,
                    192.739047287844900,
                    196.866181672889980,
                    201.009316399281570,
                    205.168199482641200,
                    209.342586752536820,
                    213.532241494563270,
                    217.736934113954250,
                    221.956441819130360,
                    226.190548323727570,
                    230.439043565776930,
                    234.701723442818260,
                    238.978389561834350,
                    243.268849002982730,
                    247.572914096186910,
                    251.890402209723190,
                    256.221135550009480,
                    260.564940971863220,
                    264.921649798552780,
                    269.291097651019810,
                    273.673124285693690,
                    278.067573440366120,
                    282.474292687630400,
                    286.893133295426990,
                    291.323950094270290,
                    295.766601350760600,
                    300.220948647014100,
                    304.686856765668720,
                    309.164193580146900,
                    313.652829949878990,
                    318.152639620209300,
                    322.663499126726210,
                    327.185287703775200,
                    331.717887196928470,
                    336.261181979198450,
                    340.815058870798960,
                    345.379407062266860,
                    349.954118040770250,
                    354.539085519440790,
                    359.134205369575340,
                    363.739375555563470,
                    368.354496072404690,
                    372.979468885689020,
                    377.614197873918670,
                    382.258588773060010,
                    386.912549123217560,
                    391.575988217329610,
                    396.248817051791490,
                    400.930948278915760,
                    405.622296161144900,
                    410.322776526937280,
                    415.032306728249580,
                    419.750805599544780,
                    424.478193418257090,
                    429.214391866651570,
                    433.959323995014870,
                    438.712914186121170,
                    443.475088120918940,
                    448.245772745384610,
                    453.024896238496130,
                    457.812387981278110,
                    462.608178526874890,
                    467.412199571608080,
                    472.224383926980520,
                    477.044665492585580,
                    481.872979229887900,
                    486.709261136839360,
                    491.553448223298010,
                    496.405478487217580,
                    501.265290891579240,
                    506.132825342034830,
                    511.008022665236070,
                    515.890824587822520,
                    520.781173716044240,
                    525.679013515995050,
                    530.584288294433580,
                    535.496943180169520,
                    540.416924105997740,
                    545.344177791154950,
                    550.278651724285620,
                    555.220294146894960,
                    560.169054037273100,
                    565.124881094874350,
                    570.087725725134190,
                    575.057539024710200,
                    580.034272767130800,
                    585.017879388839220,
                    590.008311975617860,
                    595.005524249382010,
                    600.009470555327430,
                    605.020105849423770,
                    610.037385686238740,
                    615.061266207084940,
                    620.091704128477430,
                    625.128656730891070,
                    630.172081847810200,
                    635.221937855059760,
                    640.278183660408100,
                    645.340778693435030,
                    650.409682895655240,
                    655.484856710889060,
                    660.566261075873510,
                    665.653857411105950,
                    670.747607611912710,
                    675.847474039736880,
                    680.953419513637530,
                    686.065407301994010,
                    691.183401114410800,
                    696.307365093814040,
                    701.437263808737160,
                    706.573062245787470,
                    711.714725802289990,
                    716.862220279103440,
                    722.015511873601330,
                    727.174567172815840,
                    732.339353146739310,
                    737.509837141777440,
                    742.685986874351220,
                    747.867770424643370,
                    753.055156230484160,
                    758.248113081374300,
                    763.446610112640200,
                    768.650616799717000,
                    773.860102952558460,
                    779.075038710167410,
                    784.295394535245690,
                    789.521141208958970,
                    794.752249825813460,
                    799.988691788643450,
                    805.230438803703120,
                    810.477462875863580,
                    815.729736303910160,
                    820.987231675937890,
                    826.249921864842800,
                    831.517780023906310,
                    836.790779582469900,
                    842.068894241700490,
                    847.352097970438420,
                    852.640365001133090,
                    857.933669825857460,
                    863.231987192405430,
                    868.535292100464630,
                    873.843559797865740,
                    879.156765776907600,
                    884.474885770751830,
                    889.797895749890240,
                    895.125771918679900,
                    900.458490711945270,
                    905.796028791646340,
                    911.138363043611210,
                    916.485470574328820,
                    921.837328707804890,
                    927.193914982476710,
                    932.555207148186240,
                    937.921183163208070,
                    943.291821191335660,
                    948.667099599019820,
                    954.046996952560450,
                    959.431492015349480,
                    964.820563745165940,
                    970.214191291518320,
                    975.612353993036210,
                    981.015031374908400,
                    986.422203146368590,
                    991.833849198223450,
                    997.249949600427840,
                    1002.670484599700300,
                    1008.095434617181700,
                    1013.524780246136200,
                    1018.958502249690200,
                    1024.396581558613400,
                    1029.838999269135500,
                    1035.285736640801600,
                    1040.736775094367400,
                    1046.192096209724900,
                    1051.651681723869200,
                    1057.115513528895000,
                    1062.583573670030100,
                    1068.055844343701400,
                    1073.532307895632800,
                    1079.012946818975000,
                    1084.497743752465600,
                    1089.986681478622400,
                    1095.479742921962700,
                    1100.976911147256000,
                    1106.478169357800900,
                    1111.983500893733000,
                    1117.492889230361000,
                    1123.006317976526100,
                    1128.523770872990800,
                    1134.045231790853000,
                    1139.570684729984800,
                    1145.100113817496100,
                    1150.633503306223700,
                    1156.170837573242400];
    return lnfact[n];
  }
}



function probFun(n, lam, {}, {}) {
    if (n < 0) return NaN;

    if (lam == 0) {
        if (n == 0) return 1.0;
        return 0.0;
    }

    return Math.exp(n * Math.log(lam)
                    - lnfactorial(n)
                    - lam);
}

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
if (dist == 'bernoulli') {
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
let xSize = xRangeMax - xRangeMin;

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
"""

beta_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function lnbeta(x, y) {
    if (x < 0 || y < 0) {
        throw RangeError('Arguments must be positive.');
    }
    else if (x === 0 && y === 0) return NaN;
    else if (x === 0 || y === 0) return Infinity;

    return lngamma(x) + lngamma(y) - lngamma(x + y);
}



function regularized_incomplete_beta(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continued fraction
    if (x < 0 || x > 1) {
        throw new RangeError('First argument must be between 0 and 1.');
    }

    // Special cases, there can make trouble otherwise
    else if (a === 1 && b === 1) return x;
    else if (x === 0) return 0;
    else if (x === 1) return 1;
    else if (a === 0) return 1;
    else if (b === 0) return 0;

    else {
        var bt = Math.exp(lngamma(a + b) - lngamma(a) - lngamma(b) + a * Math.log(x) + b * log1p(-x));

        // Use continued fraction directly.
        if (x < (a + 1) / (a + b + 2)) return bt * betacf(x, a, b) / a;

        // else use continued fraction after making the symmetry transformation.
        else return 1 - bt * betacf(1 - x, b, a) / b;
    }
}



function betacf(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continues fraction
    var fpmin = 1e-30,
        m = 1,
        m2, aa, c, d, del, h, qab, qam, qap;
    // These q's will be used in factors that occur in the coefficients
    qab = a + b;
    qap = a + 1;
    qam = a - 1;
    c = 1;
    d = 1 - qab * x / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    h = d;
    for (; m <= 100; m++) {
        m2 = 2 * m;
        aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        // One step (the even one) of the recurrence
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        // Next step of the recurrence (the odd one)
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        del = d * c;
        h *= del;
        if (Math.abs(del - 1.0) < 3e-7) break;
    }
    return h;
}



function log1p(x) {
    // log of 1 + x, 
    // adapted from Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    if (x <= -1.0) {
        throw new RangeError('Argument must be greater than -1.0');
    }

    // x is large enough that the obvious evaluation is OK
    else if (Math.abs(x) > 1e-4) {
        return Math.log(1.0 + x);
    }

    // Use Taylor approx. log(1 + x) = x - x^2/2 with error roughly x^3/3
    // Since |x| < 10^-4, |x|^3 < 10^-12, relative error less than 10^-8
    else {
        return (-0.5*x + 1.0)*x;
    }
}



function isone(x) {
    return Math.abs(1.0 - x) <= 1.0e-8;
}



function iszero(x) {
    return Math.abs(x) <= 1.0e-8;
}



function probFun(x, alpha, beta, {}) {
    if (x < 0) return NaN;
    if (x > 1) return NaN;

    if (iszero(x)) {
        if (alpha == 1) {
            return Math.exp(-lnbeta(alpha, beta));
        }
        else if (alpha > 1) {
            return 0.0;
        }
        else {
            return NaN;
        }
    }
    else if (isone(x)) {
        if (beta == 1) {
            return Math.exp(-lnbeta(alpha, beta));
        }
        else if (beta > 1) {
            return 0.0;
        }
        else {
            return NaN;
        }
    }

    let lnprob = (alpha - 1.0) * Math.log(x) + (beta - 1.0) * Math.log(1.0 - x) - lnbeta(alpha, beta);

    return Math.exp(lnprob);
}

function cdfFun(x, alpha, beta, {}) {
    if (x < 0) return 0.0;
    if (x > 1) return 1.0;

    return regularized_incomplete_beta(x, alpha, beta);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

cauchy_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function probFun(x, mu, sigma, {}) {
    return 1 / Math.PI / sigma / (1 + Math.pow((x - mu) / sigma, 2));
}

function cdfFun(x, mu, sigma, {}) {
    return 0.5 + Math.atan((x - mu) / sigma) / Math.PI;
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

exponential_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function probFun(x, beta, {}, {}) {
    if (x < 0) return NaN;

    return beta * Math.exp(-beta * x);
}

function cdfFun(x, beta, {}, {}) {
    if (x < 0) return 0.0;

    return 1 - Math.exp(-beta * x);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

gamma_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function gammainc_u(x, s, regularized) {
    // Adapted from Compute.io package
    var EPSILON = 1e-12;

    if (x <= 1.1 || x <= s) {
        if (regularized !== false) {
            return 1 - gammainc_l(x, s, regularized);
        } else {
            return Math.exp(lngamma(s)) - gammainc_l(x, s, regularized);
        }
    }

    var f = 1 + x - s,
        C = f,
        D = 0,
        i = 1,
        a, b, chg;
    for (i = 1; i < 10000; i++) {
        a = i * (s - i);
        b = (i<<1) + 1 + x - s;
        D = b + a * D;
        C = b + a / C;
        D = 1 / D;
        chg = C * D;
        f *= chg;
        if (Math.abs(chg - 1) < EPSILON) {
            break;
        }
    }
    if (regularized !== false) {
        return Math.exp(s * Math.log(x) - x - lngamma(s) - Math.log(f));
    } else {
        return Math.exp(s * Math.log(x) - x - Math.log(f));
    }
}



function gammainc_l(x, s, regularized) {
    // Adapted from Compute.io package
    var EPSILON = 1e-12;

    if (x === 0) {
        return 0;
    }
    if (x < 0 || s <= 0) {
        return NaN;
    }

    if(x > 1.1 && x > s) {
        if (regularized !== false) {
            return 1 - gammainc_u(x, s, regularized);
        } else {
            return Math.exp(lngamma(s)) - gammainc_u(x, s, regularized);
        }
    }

    var ft,
        r = s,
        c = 1,
        pws = 1;

    if (regularized !== false) {
        ft = s * Math.log(x) - x - lngamma(s);
    } else {
        ft = s * Math.log(x) - x;
    }
    ft = Math.exp(ft);
    do {
        r += 1;
        c *= x/r;
        pws += c;
    } while (c / pws > EPSILON);
    return pws*ft/s;
}



function probFun(x, alpha, beta, {}) {
    if (x < 0) return NaN;

    var ln_prob;

    ln_prob = alpha * Math.log(beta * x) - Math.log(x) - beta * x - lngamma(alpha);

    return Math.exp(ln_prob);
}

function cdfFun(x, alpha, beta, {}) {
    if (x < 0) return 0.0;

    return gammainc_l(beta*x, alpha, true);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

inverse_gamma_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function gammainc_u(x, s, regularized) {
    // Adapted from Compute.io package
    var EPSILON = 1e-12;

    if (x <= 1.1 || x <= s) {
        if (regularized !== false) {
            return 1 - gammainc_l(x, s, regularized);
        } else {
            return Math.exp(lngamma(s)) - gammainc_l(x, s, regularized);
        }
    }

    var f = 1 + x - s,
        C = f,
        D = 0,
        i = 1,
        a, b, chg;
    for (i = 1; i < 10000; i++) {
        a = i * (s - i);
        b = (i<<1) + 1 + x - s;
        D = b + a * D;
        C = b + a / C;
        D = 1 / D;
        chg = C * D;
        f *= chg;
        if (Math.abs(chg - 1) < EPSILON) {
            break;
        }
    }
    if (regularized !== false) {
        return Math.exp(s * Math.log(x) - x - lngamma(s) - Math.log(f));
    } else {
        return Math.exp(s * Math.log(x) - x - Math.log(f));
    }
}



function gammainc_l(x, s, regularized) {
    // Adapted from Compute.io package
    var EPSILON = 1e-12;

    if (x === 0) {
        return 0;
    }
    if (x < 0 || s <= 0) {
        return NaN;
    }

    if(x > 1.1 && x > s) {
        if (regularized !== false) {
            return 1 - gammainc_u(x, s, regularized);
        } else {
            return Math.exp(lngamma(s)) - gammainc_u(x, s, regularized);
        }
    }

    var ft,
        r = s,
        c = 1,
        pws = 1;

    if (regularized !== false) {
        ft = s * Math.log(x) - x - lngamma(s);
    } else {
        ft = s * Math.log(x) - x;
    }
    ft = Math.exp(ft);
    do {
        r += 1;
        c *= x/r;
        pws += c;
    } while (c / pws > EPSILON);
    return pws*ft/s;
}



function probFun(x, alpha, beta, {}) {
    if (x < 0) return NaN;

    var ln_prob;

    ln_prob = alpha * Math.log(beta) - (alpha + 1) * Math.log(x) - beta / x - lngamma(alpha);

    return Math.exp(ln_prob);
}

function cdfFun(x, alpha, beta, {}) {
    if (x < 0) return 0.0;

    return gammainc_u(beta/x, alpha, true);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

halfcauchy_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function probFun(x, mu, sigma, {}) {
    if (x < mu) return NaN;

    return 2.0 / Math.PI / sigma / (1 + Math.pow((x - mu) / sigma, 2));
}

function cdfFun(x, mu, sigma, {}) {
    if (x < mu) return 0.0;

    return 2.0 * Math.atan((x - mu) / sigma) / Math.PI;
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

halfnormal_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function erf(x) {
    // Error function using polynomial approximation (accurate to about 10^-7)
    var a = [1.00002368,
             0.37409196,
             0.09678418,
             -0.18628806,
             0.27886807,
             -1.13520398,
             1.48851587,
             -0.82215223,
             0.17087277];

    var t = 1 / (1 + Math.abs(x)/2);
    var expSum = -Math.pow(x, 2) - 1.26551223;

    for (var i = 0; i < a.length; i++) {
        expSum += a[i] * Math.pow(t, i+1);
    }

    var result = 1 - t * Math.exp(expSum);

    if (x < 0) return -result;
    return result;
}



function probFun(x, mu, sigma, {}) {
    if (x < mu) return NaN;

    var expTerm = (Math.pow(x - mu, 2) / 2.0 / Math.pow(sigma, 2));
    return Math.exp(-expTerm) / sigma * Math.sqrt(2.0 / Math.PI);
}

function cdfFun(x, mu, sigma, {}) {
    if (x < mu) return 0.0;

    return erf((x - mu) / sigma / Math.sqrt(2));
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

halfstudent_t_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function log1p(x) {
    // log of 1 + x, 
    // adapted from Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    if (x <= -1.0) {
        throw new RangeError('Argument must be greater than -1.0');
    }

    // x is large enough that the obvious evaluation is OK
    else if (Math.abs(x) > 1e-4) {
        return Math.log(1.0 + x);
    }

    // Use Taylor approx. log(1 + x) = x - x^2/2 with error roughly x^3/3
    // Since |x| < 10^-4, |x|^3 < 10^-12, relative error less than 10^-8
    else {
        return (-0.5*x + 1.0)*x;
    }
}



function regularized_incomplete_beta(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continued fraction
    if (x < 0 || x > 1) {
        throw new RangeError('First argument must be between 0 and 1.');
    }

    // Special cases, there can make trouble otherwise
    else if (a === 1 && b === 1) return x;
    else if (x === 0) return 0;
    else if (x === 1) return 1;
    else if (a === 0) return 1;
    else if (b === 0) return 0;

    else {
        var bt = Math.exp(lngamma(a + b) - lngamma(a) - lngamma(b) + a * Math.log(x) + b * log1p(-x));

        // Use continued fraction directly.
        if (x < (a + 1) / (a + b + 2)) return bt * betacf(x, a, b) / a;

        // else use continued fraction after making the symmetry transformation.
        else return 1 - bt * betacf(1 - x, b, a) / b;
    }
}



function betacf(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continues fraction
    var fpmin = 1e-30,
        m = 1,
        m2, aa, c, d, del, h, qab, qam, qap;
    // These q's will be used in factors that occur in the coefficients
    qab = a + b;
    qap = a + 1;
    qam = a - 1;
    c = 1;
    d = 1 - qab * x / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    h = d;
    for (; m <= 100; m++) {
        m2 = 2 * m;
        aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        // One step (the even one) of the recurrence
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        // Next step of the recurrence (the odd one)
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        del = d * c;
        h *= del;
        if (Math.abs(del - 1.0) < 3e-7) break;
    }
    return h;
}



function probFun(x, nu, mu, sigma) {
    if (x < mu) return NaN;

    var lnprob;

    lnprob = Math.log(2.0) + lngamma((nu+1)/2) - lngamma(nu/2) - Math.log(Math.PI * nu) / 2 
             - Math.log(sigma) - (nu+1)/2 * log1p(Math.pow(x - mu, 2) / nu / Math.pow(sigma, 2));

    return Math.exp(lnprob);
}

function cdfFun(x, nu, mu, sigma) {
    if (x < mu) return 0.0;

    var y = (x - mu) / sigma;

    return 1 - regularized_incomplete_beta(nu / (y**2 + nu), 0.5*nu, 0.5);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

lognormal_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function erf(x) {
    // Error function using polynomial approximation (accurate to about 10^-7)
    var a = [1.00002368,
             0.37409196,
             0.09678418,
             -0.18628806,
             0.27886807,
             -1.13520398,
             1.48851587,
             -0.82215223,
             0.17087277];

    var t = 1 / (1 + Math.abs(x)/2);
    var expSum = -Math.pow(x, 2) - 1.26551223;

    for (var i = 0; i < a.length; i++) {
        expSum += a[i] * Math.pow(t, i+1);
    }

    var result = 1 - t * Math.exp(expSum);

    if (x < 0) return -result;
    return result;
}



function probFun(x, mu, sigma, {}) {
    if (x <= 0) return NaN;

    var expTerm = (Math.pow(Math.log(x) - mu, 2) / 2.0 / Math.pow(sigma, 2))
    return Math.exp(-expTerm) / x / sigma / Math.sqrt(2 * Math.PI);
}

function cdfFun(x, mu, sigma, {}) {
    if (x <= 0) return 0.0;

    return (1 + erf((Math.log(x) - mu) / sigma / Math.sqrt(2))) / 2;
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

normal_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function erf(x) {
    // Error function using polynomial approximation (accurate to about 10^-7)
    var a = [1.00002368,
             0.37409196,
             0.09678418,
             -0.18628806,
             0.27886807,
             -1.13520398,
             1.48851587,
             -0.82215223,
             0.17087277];

    var t = 1 / (1 + Math.abs(x)/2);
    var expSum = -Math.pow(x, 2) - 1.26551223;

    for (var i = 0; i < a.length; i++) {
        expSum += a[i] * Math.pow(t, i+1);
    }

    var result = 1 - t * Math.exp(expSum);

    if (x < 0) return -result;
    return result;
}



function probFun(x, mu, sigma, {}) {
    var expTerm = (Math.pow(x - mu, 2) / 2.0 / Math.pow(sigma, 2));
    return Math.exp(-expTerm) / sigma / Math.sqrt(2 * Math.PI);
}

function cdfFun(x, mu, sigma, {}) {
    return (1 + erf((x - mu) / sigma / Math.sqrt(2))) / 2;
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

pareto_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function probFun(x, y_min, alpha, {}) {
    if (x < y_min) return NaN;

    var logp = Math.log(alpha) + alpha * Math.log(y_min) - (alpha + 1) * Math.log(x); 
    return Math.exp(logp);
}

function cdfFun(x, y_min, alpha, {}) {
    if (x < y_min) return 0.0;

    return 1 - Math.pow(y_min / x, alpha);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

student_t_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function lngamma(z) {
    // Compute log of the Gamma function using Lanczos approx.,
    // see https://en.wikipedia.org/wiki/Lanczos_approximation.

    if(z < 0) return Number('0/0');

    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1-z);

    var p = [676.5203681218851,
             -1259.1392167224028,
             771.32342877765313,
             -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
             9.9843695780195716e-6,
             1.5056327351493116e-7];

    z -= 1.0;
    var Ag = 0.99999999999980993;
    for (var i = 0; i < p.length; i++) {
        Ag += p[i] / (z + i + 1);
    }
    var t = z + p.length - 0.5;

    return 0.5 * Math.log(2*Math.PI) + (z + 0.5)*Math.log(t) - t + Math.log(Ag);
}



function log1p(x) {
    // log of 1 + x, 
    // adapted from Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    if (x <= -1.0) {
        throw new RangeError('Argument must be greater than -1.0');
    }

    // x is large enough that the obvious evaluation is OK
    else if (Math.abs(x) > 1e-4) {
        return Math.log(1.0 + x);
    }

    // Use Taylor approx. log(1 + x) = x - x^2/2 with error roughly x^3/3
    // Since |x| < 10^-4, |x|^3 < 10^-12, relative error less than 10^-8
    else {
        return (-0.5*x + 1.0)*x;
    }
}



function regularized_incomplete_beta(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continued fraction
    if (x < 0 || x > 1) {
        throw new RangeError('First argument must be between 0 and 1.');
    }

    // Special cases, there can make trouble otherwise
    else if (a === 1 && b === 1) return x;
    else if (x === 0) return 0;
    else if (x === 1) return 1;
    else if (a === 0) return 1;
    else if (b === 0) return 0;

    else {
        var bt = Math.exp(lngamma(a + b) - lngamma(a) - lngamma(b) + a * Math.log(x) + b * log1p(-x));

        // Use continued fraction directly.
        if (x < (a + 1) / (a + b + 2)) return bt * betacf(x, a, b) / a;

        // else use continued fraction after making the symmetry transformation.
        else return 1 - bt * betacf(1 - x, b, a) / b;
    }
}



function betacf(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continues fraction
    var fpmin = 1e-30,
        m = 1,
        m2, aa, c, d, del, h, qab, qam, qap;
    // These q's will be used in factors that occur in the coefficients
    qab = a + b;
    qap = a + 1;
    qam = a - 1;
    c = 1;
    d = 1 - qab * x / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    h = d;
    for (; m <= 100; m++) {
        m2 = 2 * m;
        aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        // One step (the even one) of the recurrence
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        // Next step of the recurrence (the odd one)
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        del = d * c;
        h *= del;
        if (Math.abs(del - 1.0) < 3e-7) break;
    }
    return h;
}



function probFun(x, nu, mu, sigma) {
    var lnprob;

    lnprob = lngamma((nu+1)/2) - lngamma(nu/2) - Math.log(Math.PI * nu) / 2 - Math.log(sigma)
             - (nu+1)/2 * log1p(Math.pow(x - mu, 2) / nu / Math.pow(sigma, 2));

    return Math.exp(lnprob);
}

function cdfFun(x, nu, mu, sigma) {
    var y = (x - mu) / sigma;

    if (y >= 0) {
        return 1 - regularized_incomplete_beta(nu / (y**2 + nu), 0.5*nu, 0.5) / 2;
    }
    else {
        return regularized_incomplete_beta(nu / (y**2 + nu), 0.5*nu, 0.5) / 2;        
    }
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

uniform_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function probFun(x, alpha, beta, {}) {
    if (beta <= alpha || x < alpha || x > beta) return NaN;

    return 1.0 / (beta - alpha);
}

function cdfFun(x, alpha, beta, {}) {
    if (beta <= alpha || x <= alpha) return 0.0;
    if (x >= beta) return 1.0;
    return (x - alpha) / (beta - alpha);
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

weibull_callback = """function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}

function update_y_p(probFun, x_p, arg1, arg2, arg3) {
    // Compute PMF/PDF
    var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}

function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 0; i < x_c.length; i ++)
        y_c.push(cdfFun(x_c[i], arg1, arg2, arg3));

    return y_c;
}

function probFun(x, alpha, sigma, {}) {
    if (x < 0) return NaN;

    var logp = -Math.pow(x / sigma, alpha) + (alpha - 1) * Math.log(x) 
                + Math.log(alpha) - alpha * Math.log(sigma);

    return Math.exp(logp);
}

function cdfFun(x, alpha, sigma, {}) {
    if (x < 0) return 0.0;

    return 1 - Math.exp(-Math.pow(x / sigma, alpha));
}

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
// We're not doing this now because we want to allow zooming
// JS codes now make anything outside of support NaN.
// if (dist == 'lognormal' 
//     || dist == 'gamma' 
//     || dist == 'exponential' 
//     || dist == 'inv_gamma'
//     || dist == 'weibull') {
// 	xRangeMin = 0.0;
// }
// else if (dist == 'beta') { 
//     xRangeMin = 0.0;
//     xRangeMax = 1.0;
// }

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
"""

callbacks = {
	"bernoulli": bernoulli_callback,
	"binomial": binomial_callback,
	"categorical": categorical_callback,
	"discrete_uniform": discrete_uniform_callback,
	"geometric": geometric_callback,
	"hypergeometric": hypergeometric_callback,
	"negative_binomial": negative_binomial_callback,
	"negative_binomial_mu_phi": negative_binomial_mu_phi_callback,
	"poisson": poisson_callback,
	"beta": beta_callback,
	"cauchy": cauchy_callback,
	"exponential": exponential_callback,
	"gamma": gamma_callback,
	"inverse_gamma": inverse_gamma_callback,
	"halfcauchy": halfcauchy_callback,
	"halfnormal": halfnormal_callback,
	"halfstudent_t": halfstudent_t_callback,
	"lognormal": lognormal_callback,
	"normal": normal_callback,
	"pareto": pareto_callback,
	"student_t": student_t_callback,
	"uniform": uniform_callback,
	"weibull": weibull_callback,
}

