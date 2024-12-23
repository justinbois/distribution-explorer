function isclose(x, y, rtol = 1.0e-7, atol = 1.0e-8) {
  return Math.abs(x - y) <= (atol + rtol * Math.abs(y));
}


function isone(x, rtol = 1.0e-5, atol = 1.0e-8) {
  return isclose(x, 1.0, rtol, atol);
}


function iszero(x, eps = 1.0e-8) {
  return Math.abs(x) <= eps;
}


function logspace(start, stop, n) {
  let x = new Array(n);
  let step = (stop - start) / (n - 1);
  for (let i = 0; i < n; i++) {
    x[i] = Math.pow(10, start + i * step);
  }

  return x;
}


function linspace(start, stop, n) {
  let x = new Array(n);
  let step = (stop - start) / (n - 1);
  for (let i = 0; i < n; i++) {
    x[i] = start + i * step;
  }

  return x;
}


function arange(start, stop) {
  let x = new Array(stop - start);
  for (let i = 0; i < stop - start; i++) {
    x[i] = start + i;
  }

  return x;
}


function meshgrid(x, y) {
  let m = y.length;
  let n = x.length;

  let xGrid = new Array(m);
  let yGrid = new Array(m);

  for (let i = 0; i < m; i++) {
    xGrid[i] = new Array(n);
    yGrid[i] = new Array(n);
    for (let j = 0; j < n; j++) {
      xGrid[i][j] = x[j];
      yGrid[i][j] = y[i];
    }
  }

  return [xGrid, yGrid];
}


function logit(x) {
  if (x == 0) return -Infinity;

  if (x == 1) return Infinity;

  if (x < 0 || x > 1) return NaN;

  return Math.log(x / (1.0 - x));
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


function logSumExp(x1, x2) {
  if (x1 > x2) {
    return x1 + log1p(Math.exp(x2 - x1));
  }
  else {
    return x2 + log1p(Math.exp(x1 - x2));
  }
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

/**
 * Complementary error function.
 * 
 * Uses approximation from Dia, https://doi.org/10.2139%2Fssrn.4487559.
 * 
 * Relative accuracy is about 1e-16.
 * 
 */
function erfc(x) {
  let y2 = Math.pow(x, 2);
  let y = x < 0 ? -x : x;
  const term1 = 0.56418958354775629 / (y + 2.06955023132914151);
  
  const term2 = (y**2 + 2.71078540045147805 * y + 5.80755613130301624) / 
                (y**2 + 3.47954057099518960 * y + 12.06166887286239555);

  const term3 = (y**2 + 3.47469513777439592 * y + 12.07402036406381411) / 
                (y**2 + 3.72068443960225092 * y + 8.44319781003968454);

  const term4 = (y**2 + 4.00561509202259545 * y + 9.30596659485887898) / 
                (y**2 + 3.90225704029924078 * y + 6.36161630953880464);

  const term5 = (y**2 + 5.16722705817812584 * y + 9.12661617673673262) / 
                (y**2 + 4.03296893109262491 * y + 5.13578530585681539);

  const term6 = (y**2 + 5.95908795446633271 * y + 9.19435612886969243) / 
                (y**2 + 4.11240942957450885 * y + 4.48640329523408675);

  const expTerm = Math.exp(-Math.pow(x,2));

  let res = term1 * term2 * term3 * term4 * term5 * term6 * expTerm;

  return x < 0 ? 2.0 - res : res;
}


/**
 * Inverse error function.
 * 
 * Uses algorithm PPND7 from Wichura, 1987: https://doi.org/10.2307/2347330
 * 
 * Accurate to about seven figures.
 * 
 */
function erfinv(x) {
  // Convert x to a percentile of standard normal
  let p = (x + 1.0) / 2.0;

  // Check input
  if (p == 0.0) return -Infinity;
  if (p == 1.0) return Infinity;
  if (p > 1.0 || p < 0.0) return undefined;

  let split1 = 0.425;
  let split2 = 5.0;
  let const1 = 0.180625;
  let const2 = 1.6;

  // Coefficients for p close to 1/2
  let a0 = 3.3871327179;
  let a1 = 5.0434271938e1;
  let a2 = 1.5929113202e2;
  let a3 = 5.9109374720e1;
  let b1 = 1.7895169469e1;
  let b2 = 7.8757757664e1;
  let b3 = 6.7187563600e1;

  // Coefficients for not close to 1/2 nor 0 or 1
  let c0 = 1.4234372777;
  let c1 = 2.7568153900;
  let c2 = 1.3067284816;
  let c3 = 1.7023821103e-1;
  let d1 = 7.3700164250e-1;
  let d2 = 1.2021132975e-1;

  // Coefficients for near 0 or 1
  let e0 = 6.6579051150;
  let e1 = 3.0812263860;
  let e2 = 4.2868294337e-1;
  let e3 = 1.7337203997e-2;
  let f1 = 2.4197894225e-1;
  let f2 = 1.2258202635e-2;

  let r;
  let res;
  let q = p - 0.5;

  if (Math.abs(q) <= split1) {
    r = const1 - q * q;
    res = q * (((a3 * r + a2) * r + a1) * r + a0) /
              (((b3 * r + b2) * r + b1) * r + 1.0);
  } else {
    r = q < 0 ? p : 1.0 - p;

    r = Math.sqrt(-Math.log(r));

    if (r <= split2) {
      r -= const2;
      res = (((c3 * r + c2) * r + c1) * r + c0) /
             ((d2 * r + d1) * r + 1.0);
    } else {
      r -= split2;
      res = (((e3 * r + e2) * r + e1) * r + e0) /
             ((f2 * r + f1) * r + 1.0);
    }
  
    if (q < 0) {
      res = -res;
    }
  }

  // To convert to erfinv, need to divide by sqrt of 2.
  return 0.7071067811865475 * res;

}

/**
 * Logarithm of CDF of a normal distribution
 * 
 * Uses algorithm PPND7 from Wichura, 1987: https://doi.org/10.2307/2347330
 * 
 */
function lnStdNormCdf(x) {
  // y is x / sqrt(2)
  let y = x / 1.4142135623730950488016887;

  let res;
  // Easy to compute when y is more then zero (CDF > 0.5)
  if (y > 0.0) {
    res = log1p(-0.5 * erfc(y));
  } 
  else if (y > -20.0) {
    // log(erfc(-y) - log(2))
    res = Math.log(erfc(-y)) - 0.6931471805599453;
  }
  else {
    // Approximate based on W. J. Cody, Math. Comp., 1969.
    const y2 = Math.pow(y, 2);
    const y4 = Math.pow(y, 4);
    const y6 = Math.pow(y, 6);
    const y8 = Math.pow(y, 8);
    const y10 = Math.pow(y, 10);
    const temp_p = 0.000658749161529837803157 + 0.0160837851487422766278 / y2
                 + 0.125781726111229246204 / y4 + 0.360344899949804439429 / y6
                 + 0.305326634961232344035 / y8 + 0.0163153871373020978498 / y10;
    const temp_q = -0.00233520497626869185443 - 0.0605183413124413191178 / y2
                   - 0.527905102951428412248 / y4 - 1.87295284992346047209 / y6
                   - 2.56852019228982242072 / y8 - 1.0 / y10;
    res = -0.6931471805599453 + Math.log(0.5641895835477563 + (temp_p / temp_q) / y2) - Math.log(-y) - y2;
  }

  if (isNaN(res)) {
    return -Infinity;
  }
  else {
    return res;
  }
}


function lnchoice(n, k) {
    return lnfactorial(n) - lnfactorial(n-k) - lnfactorial(k);
}


function lnbeta(x, y) {
    if (x < 0 || y < 0) {
        throw RangeError('Arguments must be positive.');
    }
    else if (x === 0 && y === 0) return NaN;
    else if (x === 0 || y === 0) return Infinity;

    return lngamma(x) + lngamma(y) - lngamma(x + y);
}


function betacf(x, a, b) {
    // From Andreas Madsen's mathfn, Copyright (c) 2013 Andreas Madsen
    // Computes incomplete beta function as a continued fraction
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


function regularizedIncompleteBeta(x, a, b) {
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


function incompleteBeta(x, a, b) {
    return regularizedIncompleteBeta(x, a, b) * Math.exp(lnbeta(a, b));
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


function gammaincU(x, s, regularized) {
  // Upper incomplete gamma function. Note that the order of the arguments,
  // x and s, are switched from common usage, e.g., on the Wikipedia page.
  // Adapted from Compute.io package
  var EPSILON = 1e-12;

  if (x <= 1.1 || x <= s) {
    if (regularized !== false) {
      return 1 - gammaincL(x, s, regularized);
    } else {
      return Math.exp(lngamma(s)) - gammaincL(x, s, regularized);
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


function gammaincL(x, s, regularized) {
  // Lower incomplete gamma function. Note that the order of the arguments,
  // x and s, are switched from common usage, e.g., on the Wikipedia page.
  // Adapted from Compute.io package
  var EPSILON = 1e-12;

  if (x === 0) {
    return 0;
  }
  if (x < 0 || s <= 0) {
    return NaN;
  }

  if (x > 1.1 && x > s) {
    if (regularized !== false) {
      return 1 - gammaincU(x, s, regularized);
    } else {
      return Math.exp(lngamma(s)) - gammaincU(x, s, regularized);
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

  return pws * ft / s;
}


function hyp1f1(a, b, x) {
  let i, j, la, n, nl;
  let a0 = a, a1 = a, x0 = x, y0, y1, hg1, hg2, r1, r2, rg, xg, sum1, sum2;
  let hg = 0.0;

  // DLMF 13.2.39
  if (x < 0.0) {
    a = b - a;
    a0 = a;
    x = Math.abs(x);
  }
  nl = 0;
  la = 0;
  if (a >= 2.0) {
    // preparing terms for DLMF 13.3.1
    nl = 1;
    la = Math.floor(a);
    a -= la + 1;
  }
  y0 = 0.0;
  y1 = 0.0;
  for (n = 0; n < (nl + 1); n++) {
    if (a0 >= 2.0) { a += 1.0; }
    if ((x <= 30.0 + Math.abs(b)) || (a < 0.0)) {
      hg = 1.0;
      rg = 1.0;
      for (j = 1; j < 501; j++) {
        rg *= (a + j - 1.0) / (j * (b + j - 1.0)) * x;
        hg += rg;
        if (rg / hg < 1e-15) {
          // DLMF 13.2.39 (cf. above)
          if (x0 < 0.0) { hg *= Math.exp(x0); }
          break;
        }
      }
    } else {
      // DLMF 13.7.2 & 13.2.4, SUM2 corresponds to first sum
      const cta = lngamma(a);
      const ctb = lngamma(b);
      xg = b - a;
      const ctba = lngamma(xg);
      sum1 = 1.0;
      sum2 = 1.0;
      r1 = 1.0;
      r2 = 1.0;
      for (i = 1; i < 9; i++) {
        r1 = -r1 * (a + i - 1.0) * (a - b + i) / (x * i);
        r2 = -r2 * (b - a + i - 1.0) * (a - i) / (x * i);
        sum1 += r1;
        sum2 += r2;
      }
      if (x0 >= 0.0) {
        hg1 = Math.exp(ctb - ctba) * Math.pow(x, -a) * Math.cos(Math.PI * a) * sum1;
        hg2 = Math.exp(ctb - cta + x) * Math.pow(x, a - b) * sum2;
      } else {
        // DLMF 13.2.39 (cf. above)
        hg1 = Math.exp(ctb - ctba + x0) * Math.pow(x, -a) * Math.cos(Math.PI * a) * sum1;
        hg2 = Math.exp(ctb - cta) * Math.pow(x, a - b) * sum2;
      }
      hg = hg1 + hg2;
    }
    if (n === 0) { y0 = hg; }
    if (n === 1) { y1 = hg; }
  }
  if (a0 >= 2.0) {
    // DLMF 13.3.1
    for (i = 1; i < la; i++) {
      hg = ((2.0 * a - b + x) * y1 + (b - a) * y0) / a;
      y0 = y1;
      y1 = hg;
      a += 1.0;
    }
  }
  a = a1;
  x = x0;
  return hg;
}



function chbevl(x, A) {
  // Evaluate a Chebyshev polynomial at x with coefficents A.
  // Based on the cephes library (https://www.netlib.org/cephes/),
  // Copyright 1984 - 1992 by Stephen L. Moshier, from the book
  // Moshier, Methods and Programs for Mathematical Functions, Prentice-Hall, 1989.

  let b0, b1, b2;
  let n = A.length;
  let i = n - 1;

  b0 = A[0];
  b1 = 0.0;

  for (let j = 1; j <= i; j++) {
    b2 = b1;
    b1 = b0;
    b0 = x * b1 - b2 + A[j];
  }

  return 0.5 * (b0 - b2);
}

function polevl(x, coef) {
  // Evaluate a polynomial at x with coefficents coef.
  // Based on the cephes library (https://www.netlib.org/cephes/),
  // Copyright 1984 - 1992 by Stephen L. Moshier, from the book
  // Moshier, Methods and Programs for Mathematical Functions, Prentice-Hall, 1989.

    let result;
    let n = coef.length;

    let i = n;

    result = coef[0];

    for (let j = 1; j <= n; j++) {
        result = result * x + coef[j];
    }

    return result;
}

function besseli0(x, expWeighted = false) {
  // Based on the cephes library (https://www.netlib.org/cephes/),
  // Copyright 1984 - 1992 by Stephen L. Moshier, from the book
  // Moshier, Methods and Programs for Mathematical Functions, Prentice-Hall, 1989.
  // Uses a Chebyshev interpolant.
  let A = [
    -4.41534164647933937950e-18,
     3.33079451882223809783e-17,
    -2.43127984654795469359e-16,
     1.71539128555513303061e-15,
    -1.16853328779934516808e-14,
     7.67618549860493561688e-14,
    -4.85644678311192946090e-13,
     2.95505266312963983461e-12,
    -1.72682629144155570723e-11,
     9.67580903537323691224e-11,
    -5.18979560163526290666e-10,
     2.65982372468238665035e-9,
    -1.30002500998624804212e-8,
     6.04699502254191894932e-8,
    -2.67079385394061173391e-7,
     1.11738753912010371815e-6,
    -4.41673835845875056359e-6,
     1.64484480707288970893e-5,
    -5.75419501008210370398e-5,
     1.88502885095841655729e-4,
    -5.76375574538582365885e-4,
     1.63947561694133579842e-3,
    -4.32430999505057594430e-3,
     1.05464603945949983183e-2,
    -2.37374148058994688156e-2,
     4.93052842396707084878e-2,
    -9.49010970480476444210e-2,
     1.71620901522208775349e-1,
    -3.04682672343198398683e-1,
     6.76795274409476084995e-1
  ];

  let B = [
    -7.23318048787475395456e-18,
    -4.83050448594418207126e-18,
     4.46562142029675999901e-17,
     3.46122286769746109310e-17,
    -2.82762398051658348494e-16,
    -3.42548561967721913462e-16,
     1.77256013305652638360e-15,
     3.81168066935262242075e-15,
    -9.55484669882830764870e-15,
    -4.15056934728722208663e-14,
     1.54008621752140982691e-14,
     3.85277838274214270114e-13,
     7.18012445138366623367e-13,
    -1.79417853150680611778e-12,
    -1.32158118404477131188e-11,
    -3.14991652796324136454e-11,
     1.18891471078464383424e-11,
     4.94060238822496958910e-10,
     3.39623202570838634515e-9,
     2.26666899049817806459e-8,
     2.04891858946906374183e-7,
     2.89137052083475648297e-6,
     6.88975834691682398426e-5,
     3.36911647825569408990e-3,
     8.04490411014108831608e-1
  ];

  if ( x < 0 ) x = -x;

  let result;
  if (x <= 8.0) {
    let y = x / 2.0 - 2.0;
    result = chbevl(y, A);
  } else {
    result = chbevl(32.0 / x - 2.0, B) / Math.sqrt(x)
  }

  if (expWeighted) return result;
  else return Math.exp(x) * result;
}

function cosm1(x) {
  // Based on the cephes library (https://www.netlib.org/cephes/),
  // Copyright 1984 - 1992 by Stephen L. Moshier, from the book
  // Moshier, Methods and Programs for Mathematical Functions, Prentice-Hall, 1989.
  //
  // If x is small, appoximates cos(x) - 1 by the first several terms in series expansion.
  let coeffs = [
     4.7377507964246204691685E-14,
    -1.1470284843425359765671E-11,
     2.0876754287081521758361E-9,
    -2.7557319214999787979814E-7,
     2.4801587301570552304991E-5,
    -1.3888888888888872993737E-3,
     4.1666666666666666609054E-2
   ];

  let quarterPi = Math.PI / 4;

  if (x < quarterPi || x > quarterPi) return Math.cos(x) - 1.0;

  let x2 = x * x;
  return -0.5 * x2 + x2 * x2 * polevl(x2, coeffs);
}

function chebPoints(n, low = -1, high = 1) {
  // Chebyshev points going from 1 to -1
  let points = Array.from({ length: n }, (_, i) => Math.cos(Math.PI * i / (n - 1)));

  // Shift and scale
  let m = (high - low) / 2.0;
  let b = (high + low) / 2.0;

  points = points.map((x) => m * x + b);

  return points;
}


function clenshawCurtisWeights(n) {
    n -= 1; // Adjust for zero-based indexing

    const theta = Array.from({ length: n + 1 }, (_, i) => Math.PI * i / n);
    let w = new Array(n + 1).fill(0);
    let v = new Array(n - 1).fill(1);

    if (n % 2 === 0) {
        w[0] = 1.0 / (n ** 2 - 1);
        w[n] = w[0];
        for (let k = 1; k < n / 2; k++) {
            for (let j = 1; j < n; j++) {
                v[j - 1] -= 2.0 * Math.cos(2.0 * k * theta[j]) / (4.0 * k ** 2 - 1);
            }
        }
        for (let j = 1; j < n; j++) {
            v[j - 1] -= Math.cos(n * theta[j]) / (n ** 2 - 1);
        }
    } else {
        w[0] = 1.0 / n ** 2;
        w[n] = w[0];
        for (let k = 1; k <= (n - 1) / 2; k++) {
            for (let j = 1; j < n; j++) {
                v[j - 1] -= 2.0 * Math.cos(2.0 * k * theta[j]) / (4.0 * k ** 2 - 1);
            }
        }
    }

    for (let j = 1; j < n; j++) {
        w[j] = 2.0 * v[j - 1] / n;
    }

    return w;
}


function clenshawCurtisIntegrate(f, a, b, n = 100, args = [], weights = undefined) {
  // Numerically integrate a function from a to b using n Chebyshev points
  // If weights is given, uses those as Clenshaw-Curtis weights, assuming
  // they have been set up properly for the domain of integration.

  if (weights === undefined) {
    // Get Clenshaw-Curtis weights
    let ccWeights = clenshawCurtisWeights(n);

    // Rescale for the size of the integration domain
    weights = ccWeights.map((x) => (b - a) / 2.0 * x);
  }

  // Generate Chebyshev points from 1 to -1
  let x = chebPoints(n);

  // Center and scale points for integration
  x = x.map((x) => (b - a) / 2.0 * x + (b + a) / 2.0);

  // Evaluate f at the points
  let fVals = x.map((x) => f(x, ...args));

  // Compute the integral
  return dot(weights, fVals);
}


function lnfactorial(n) {
  if (n > 254) { // Use Stirling's approximation
    let x = n + 1;
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1.0 / (12.0 * x);
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


module.exports = { isclose, isone, iszero, linspace, logspace, meshgrid, arange, logit, log1p, erf, erfinv, lnchoice, lnbeta, betacf, regularizedIncompleteBeta, incompleteBeta, lngamma, gammaincU, gammaincL, clenshawCurtisWeights, clenshawCurtisIntegrate, chebPoints, lnfactorial, hyp1f1, chbevl, besseli0, cosm1 };