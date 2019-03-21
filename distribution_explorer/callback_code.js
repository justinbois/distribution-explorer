function linspace(start, stop, n) {
	var x = [];
	var currValue = start;
	var step = (stop - start) / (n - 1);
	for (var i = 0; i < n; i++) {
		x.push(currValue);
		currValue += step;
	}
	return x;
}


function arange(start, stop) {
	var x = [];
	for (var i = start; i < stop; i++) x.push(i);
	return x;
}


function bernoulli_prob(x, theta, {}, {}) {
	if (x == 0) return 1 - theta;
	else if (x == 1) return theta;
	else return 0.0;
}


function geometric_prob(x, theta, {}, {}) {
	if (theta == 1) {
		if (x == 0) return 1.0;
		return 0.0;
	}

	if (x < 0 || theta == 0) return 0.0;

	return Math.exp(x * Math.log(1-theta) + Math.log(theta))
}


function negative_binomial_prob(y, alpha, beta, {}) {
    if (y  < 0) return 0.0;

    return Math.exp(lngamma(y + alpha)
                    - lngamma(alpha)
                    - lnfactorial(y)
                    + alpha * Math.log(beta / (1 + beta))
                    - y * Math.log(1 + beta));
}


function negative_binomial_mu_phi_prob(y, mu, phi, {}) {
   	return negative_binomial_prob(y, phi, phi/mu, {});
}


function binomial_prob(n, N, theta, {}) {
    if (n > N || n < 0) return 0.0;

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


function beta_binomial_prob(n, N, alpha, beta) {
    if (n > N || n < 0) return 0.0;

    return Math.exp(lnchoice(N, n)
                    + lnbeta(n+alpha, N-n+beta)
                    - lnbeta(alpha, beta));
}


function poisson_prob(n, lam, {}, {}) {
    if (n < 0) return 0.0;

    if (lam == 0) {
        if (n == 0) return 1.0;
        return 0.0;
    }

    return Math.exp(n * Math.log(lam)
                    - lnfactorial(n)
                    - lam);
}


function hypergeometric_prob(n, N, a, b) {
    if (n < Math.max(0, N-b) || n > Math.min(N, a)) return 0.0;

    return Math.exp(lnchoice(a, n) + lnchoice(b, N-n) - lnchoice(a+b, N));
}


function categorical_prob(cat, theta1, theta2, theta3) {
    var theta4 = 1 - theta1 - theta2 - theta3
    if (theta4 < 0) return 0.0;
    if (![1, 2, 3, 4].includes(cat)) return 0.0;

    var probs = [theta1, theta2, theta3, theta4]

    return probs[cat-1];
}


function discrete_uniform_prob(n, low, high, {}) {
    if (low > high || n < low || n > high) return 0.0

    return 1 / (high - low + 1)
}


function uniform_prob(x, alpha, beta, {}) {
    if (beta <= alpha || x < alpha || x > beta) return 0.0;

    return 1 / (beta - alpha);
}


function uniform_cdf(x, alpha, beta, {}) {
    if (beta <= alpha || x <= alpha) return 0.0;
    if (x >= beta) return 1.0;
    return (x - alpha) / (beta - alpha);
}



function normal_prob(x, mu, sigma, {}) {
    var expTerm = (Math.pow(x-mu, 2) / 2.0 / Math.pow(sigma, 2))
    return Math.exp(-expTerm) / sigma / Math.sqrt(2 * Math.PI);
}


function normal_cdf(x, mu, sigma, {}) {
    return (1 + erf((x-mu) / sigma / Math.sqrt(2))) / 2;
}


function discrete_cdf(cumsum, y_p) {
	var y_c = [];

	y_c.push(cumsum, cumsum);
    for (var i = 0; i < y_p.length; i++) {
        cumsum += y_p[i];
		y_c.push(cumsum, cumsum);
    }

    return y_c;
}


function update_y_p(probFun, x_p, arg1, arg2, arg3) {
	// Compute PMF
	var y_p = [];
    for (var i = 0; i < x_p.length; i++) {
      y_p.push(probFun(x_p[i], arg1, arg2, arg3));
    }

    return y_p;
}


function update_y_c_discrete(probFun, x_p, y_p, arg1, arg2, arg3) {
    // Compute CDF
    var cumsum = 0.0
    for (var i = 0; i < x_p[0]; i++) {
        cumsum += probFun(x_p[i], arg1, arg2, arg3);
    }

    y_c = discrete_cdf(cumsum, y_p);
    return y_c;
}


function update_y_c_continuous(cdfFun, x_c, arg1, arg2, arg3) {
    var y_c = [];
    for (var i = 1; i < x_c.length; i ++)
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
             0.17087277]

    var t = 1 / (1 + Math.abs(x)/2);
    var expSum = -Math.pow(x, 2) - 1.26551223;

    for (var i = 0; i < a.length; i++) {
        expSum += a[i] * Math.pow(t, i+1);
    }

    var result = 1 - t * Math.exp(expSum);

    if (x < 0) return -result;
    return result;
}


function lnchoice(n, k) {
    return lnfactorial(n) - lnfactorial(n-k) - lnfactorial(k);
}


function lnbeta(x, y) {
    return lngamma(x) + lngamma(y) - lngamma(x + y);
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
                    1156.170837573242400]
    return lnfact[n];
  }
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
else if (discrete) {
  	xRangeMin = Math.max(0, Math.floor(xRangeMin));
	xRangeMax = Math.floor(xRangeMax);
}

// x-values to evaluate PMF/PDF and CDF
if (discrete) {
	x_p = arange(xRangeMin, xRangeMax+1);
	xSize = xRangeMax - xRangeMin;

	x_c = [];
	for (var i = 0; i < x_p.length; i++) x_c.push(x_p[i], x_p[i]);

	x_c.unshift(Math.max(xRangeMin - 0.05 * xSize, xRangeMin - 0.95));
	x_c.push(Math.min(xRangeMax + 0.05 * xSize, xRangeMax + 0.95));
}
else {
	x_p = linspace(xRangeMin, xRangeMax, n);
	x_c = x_p
}

// Update sources with new x-values
source_p.data['x'] = x_p
source_c.data['x'] = x_c

// Which function to compute probability or probability density
var probFun
var cdfFun
if (dist === 'bernoulli') probFun = bernoulli_prob;
else if (dist === 'geometric') probFun = geometric_prob;
else if (dist === 'negative_binomial') probFun = negative_binomial_prob;
else if (dist === 'negative_binomial_mu_phi') probFun = negative_binomial_mu_phi_prob;
else if (dist === 'binomial') probFun = binomial_prob;
else if (dist === 'beta_binomial') probFun = beta_binomial_prob;
else if (dist === 'poisson') probFun = poisson_prob;
else if (dist === 'hypergeometric') probFun = hypergeometric_prob;
else if (dist === 'categorical') probFun = categorical_prob;
else if (dist === 'discrete_uniform') probFun = discrete_uniform_prob;
else if (dist == 'uniform') {
    probFun = uniform_prob;
    cdfFun = uniform_cdf;
}
else if (dist == 'normal') {
    probFun = normal_prob;
    cdfFun = normal_cdf;
}

// Update the PMF/PDF and CDF
source_p.data['y_p'] = update_y_p(probFun, 
        x_p, arg1.value, arg2.value, arg3.value);
if (discrete) {
	source_c.data['y_c'] = update_y_c_discrete(probFun, 
		x_c, source_p.data['y_p'], arg1.value, arg2.value, arg3.value);
}
else {
    source_c.data['y_c'] = update_y_c_continuous(cdfFun, 
        x_c, arg1.value, arg2.value, arg3.value);
}

source_p.change.emit();
source_c.change.emit();