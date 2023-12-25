class UnivariateDistribution {
  constructor() {}

  xMin(params) {
    // Minimal value of support; defined for each distribution.
  }

  xMax(params) {
    // Maxima value of support; defined for each distribution.
  }

  cdfSingleValue(x, params, xMin = 0) {
    // Empty; defined for each distribution.
  }

  ppfSingleValue(p, params, xMin = 0, xMax = Infinity, p1Value = Infinity) {
    // Empty; defined for each distribution.
  }

  quantileSet(x, p, xMin = -Infinity, xMax = Infinity) {
    // Empty; defined for each distribution.    
  }

  defaultXRange(params) {
    // Default x-range for reset button. Empty; defined for each distribution.
  }


  cdf(x, params, xMin = 0) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (x, params) => this.cdfSingleValue(x, params, xMin),
      x,
      params
    );
  }

  ppfSingleValueWithCheck(p, params, xMin = 0, xMax = Infinity, p1Value = Infinity) {
    if (p < 0 || p > 1) return NaN;
    return this.ppfSingleValue(p, params, xMin, xMax, p1Value);
  }

  ppf(p, params, xMin = 0, xMax = Infinity, p1Value = Infinity) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (p, params) => this.ppfSingleValueWithCheck(p, params, xMin, xMax, p1Value),
      p,
      params
    );
  }

  resetXRange(params, p) {
    if (p === undefined) {
      return this.defaultXRange(params);
    } else if (this.checkResetp(p)) {
      return this.ppf(p, params);
    }
  }

  scalarOrArrayCompute(func, x, params) {
    // For now, we will not allow Matrix objects here, since that leads to bloat
    // required to have the matrix package in there.
    // if (x instanceof Matrix) {
    //   if (x.columns != 1) throw new Error('Must be a column vector.');
      
    //   let xLen = x.rows;
    //   let res = [];
    //   for (let i = 0; i < xLen; i++) {
    //     res.push(func(x.get(i, 0), params));
    //   }

    //   return res;
    // } else 

    if (x instanceof Array) {
      let xLen = x.length;

      let res = [];
      for (let i = 0; i < xLen; i++) {
        res.push(func(x[i], params));
      }

      return res;
    } else {
      return func(x, params);
    }
  }

  scalarToArrayParams(params) {
    return params instanceof Array ? params : [params]
  }
}


class DiscreteUnivariateDistribution extends UnivariateDistribution {
  constructor() {
    super();
  }

  pmfSingleValue(x, params) {
    // Empty; defined for each distribution.
  }

  pmf(x, params) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (x, params) => this.pmfSingleValue(x, params),
      x,
      params);
  }

  cdfSingleValue(x, params, xMin = 0) {
    params = this.scalarToArrayParams(params);

    // Compute CDF by summing up to x for which it is desired.
    let cumsum = 0.0;
    let summand = 0.0;
    for (let n = xMin; n <= x; n++) {
        summand = this.pmfSingleValue(n, params);
        if (!isNaN(summand)) cumsum += summand;
    }

    return cumsum;
  }

  cdfForPlotting(xStart, xEnd, params, xMin = 0) {
    // This is a faster CDF for plotting, since it is assumed that
    // values for the CDF are wanted at all integer values between
    // xStart and xEnd, inclusive. Values of the CDF are also repeated
    // so that the CDF has a staircase look. 
    params = this.scalarToArrayParams(params);

    // Compute CDF by summing up to first value of x for which it is desired.
    let cumsum = 0.0;
    let prob;
    for (let x = xMin; x < xStart; x++) {
      prob = this.pmfSingleValue(x, params);
      if (!isNaN(prob)) cumsum += prob;
    }

    // Now start building CDF.
    let yCDF = [];
    for (let x = xStart; x < xEnd; x++) {
      prob = this.pmfSingleValue(x, params);
      if (!isNaN(prob)) cumsum += prob;
      yCDF.push(cumsum, cumsum);
    }

    return yCDF;
  }

  ppfSingleValue(p, params, xMin = 0, xMax = Infinity, p1Value = Infinity) {
    // ppf is minimum value of x such that F(x) ≥ p where F(x) is the CDF
    if (p == 0) return xMin;

    // If asking for for p = 1, return prescribed value
    if (p == 1) return p1Value;

    params = this.scalarToArrayParams(params);

    // Initialize
    let n = xMin;
    let cumsum = this.pmfSingleValue(n, params);

    let iters = 0;
    let summand = 0.0;
    while (cumsum < p && !isclose(cumsum, p) && !isNaN(summand) && n < xMax) {
      n += 1;
      summand = this.pmfSingleValue(n, params);

      if (!isNaN(summand)) cumsum += summand;

      iters += 1;
    }

    return n;
  }

}


class ContinuousUnivariateDistribution extends UnivariateDistribution {
  constructor() {
    super();
  }

  pdfSingleValue(x, params) {
    // Empty; defined for each distribution.
  }

  pdf(x, params) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (x, params) => this.pdfSingleValue(x, params),
      x,
      params
    );
  }

}


class TemplateDiscreteUnivariateDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
    // Can have more specifications in the constructor.
  }

  xMin(params) {
    // Must be specified.    
  }

  xMax(params) {
    // Must be specified.    
  }

  pmfSingleValue(x, params) {
    // Must be specified.
  }

  defaultXRange(params) {
    // Must be specified.
  }

  quantileSet(x, p) {
    // Must be specified.
  }

  // CDF and PPF are automatically computed in the superclass. These can be overrided by
  // specifying:
  //   cdfSingleValue(x, params, xMin)
  //   ppfSingleValue(p, params, xMin, xMax, p1Value)
  //
  // You should not respecify cdf, pmf, ppf; only specify the calculations for a single value.
}


class TemplateContinuousUnivariateDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of independent variable (used in quantile setter)
    this.varName = '';

    // Name of parameters (may be used in quantile setter)
    this.paramNames = [];

    // Can have more specifications in the constructor.
  }

  xMin(params) {
    // Must be specified.    
  }

  xMax(params) {
    // Must be specified.    
  }

  pdfSingleValue(x, params) {
    // Must be specified.
  }

  cdfSingleValue(x, params) {
    // Must be specified.
  }

  ppfSingleValue(p, params) {
    // Must be specified.
  }

  defaultXRange(params) {
    // Must be specified.
  }

  quantileSet(x, p) {
    // Must be specified.
  }

  // You should not respecify cdf, pdf, ppf; only specify the calculations for a single value.
}


class BernoulliDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return 1;
  }

  pmfSingleValue(x, params) {
    let theta = params[0];

    if (x == 0) return 1 - theta;
    else if (x == 1) return theta;
    else return 0.0;
  }

  ppfSingleValue(p, params) {
    if (p == 0) return -1;
    if (p == 1) return 1;
    return 0;
  }

  defaultXRange(params) {
    return [-0.2, 1.2];
  }

}


class BetaBinomialDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return params[0];
  }

  pmfSingleValue(n, params) {
    let [N, alpha, beta] = params.slice(0, 3);

    if (n > N || n < 0) return NaN;

    return Math.exp(lnchoice(N, n) + lnbeta(n + alpha, N - n + beta) - lnbeta(alpha, beta));
  }

  ppfSingleValue(p, params) {
    let [N, alpha, beta] = params.slice(0, 3);

    return super.ppfSingleValue(p, params, 0, N, N);
  }

  defaultXRange(params) {
    let [N, alpha, beta] = params.slice(0, 3);

    return [-1, N + 1];
  }

}


class BinomialDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return params[0];
  }

  pmfSingleValue(n, params) {
    let [N, theta] = params.slice(0, 2);

    if (n > N || n < 0) return NaN;

    if (theta == 0) {
      if (n == 0) return 1.0;
      return 0.0;
    }

    if (theta == 1) {
      if (n == N) return 1.0;
      return 0.0;
    }

    return Math.exp(lnchoice(N, n) +
      n * Math.log(theta) +
      (N - n) * Math.log(1 - theta));
  }

  ppfSingleValue(p, params) {
    let [N, theta] = params.slice(0, 2);
    
    return super.ppfSingleValue(p, params, 0, N, N);
  }

  defaultXRange(params) {
    let [N, theta] = params.slice(0, 2);

    if (N < 50) {
      return [-1, N + 1];
    } else {
      return this.ppf([0.001, 0.999], params);
    }
  }
}


class CategoricalDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return 1;
  }

  xMax(params) {
    return 4;
  }

  pmfSingleValue(cat, params) {
    let [theta1, theta2, theta3] = params.slice(0, 3);
    let theta4 = 1 - theta1 - theta2 - theta3

    // If the theta's don't sum to one, return NaN
    if (theta4 < 0) return NaN;

    // Only allow categories 1, 2, 3, 4
    if (![1, 2, 3, 4].includes(cat)) return NaN;

    let probs = [theta1, theta2, theta3, theta4]

    return probs[cat-1];
  }

  defaultXRange(params) {
    return [-0.2, 4.2];
  }

}


class DiscreteUniformDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return params[0];
  }

  xMax(params) {
    return params[1];
  }

  pmfSingleValue(n, params) {
    let [low, high] = params.slice(0, 2);

    if (low > high || n < low || n > high) return NaN;

    return 1 / (high - low + 1);
  }

  ppfSingleValue(p, params) {
    let [low, high] = params.slice(0, 2);
    
    return super.ppfSingleValue(p, params, low, high, high);
  }

  defaultXRange(params) {
    let [low, high] = params.slice(0, 2);

    return [low - 1, high + 1];
  }

}


class GeometricDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return Infinity;
  }

  pmfSingleValue(x, params) {
    let theta = params[0];

    if (theta == 1) {
      if (x == 0) return 1.0;
      return 0.0;
    }

    if (theta == 0) return 0.0;

    if (x < 0) return NaN;

    return Math.exp(x * Math.log(1.0 - theta) + Math.log(theta));
  }

  ppfSingleValue(p, params) {
    let theta = params[0];

    if (p == 0) return 0;
    if (p == 1) return Infinity;

    let res = Math.ceil(Math.log(1 - p) / Math.log(1 - theta) - 1);

    if (res === -0) return 0;
    return res;
  }

  defaultXRange(params) {
    let theta = params[0];

    return [-1, this.ppfSingleValue(0.999, params)];
  }

}



class HypergeometricDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    let [N, a, b] = params.slice(0, 2);
    return Math.max(0, N - b);
  }

  xMax(params) {
    return Math.min(N, a);
  }

  pmfSingleValue(n, params) {
    let [N, a, b] = params.slice(0, 2);

    if (n < Math.max(0, N - b) || n > Math.min(N, a)) return NaN;

    return Math.exp(lnchoice(a, n) + lnchoice(b, N - n) - lnchoice(a + b, N));
  }

  ppfSingleValue(p, params) {
    let [N, alpha, beta] = params.slice(0, 3);

    return super.ppfSingleValue(p, params, this.xMin(params), this.xMax(params), this.xMax(params));
  }

  defaultXRange(params) {
    let [N, alpha, beta] = params.slice(0, 3);

    return [Math.max(0, N - b) - 1, Math.min(N, a) + 1];
  }
}


class NegativeBinomialDistribution extends DiscreteUnivariateDistribution {
  constructor(parametrization) {
    super();

    if (parametrization === undefined) {
      this.parametrization = 'alpha-beta'
    } else {
      this.parametrization = parametrization;
    }
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return Infinity;
  }

  pmfSingleValue(y, params) {
    if (y < 0) return NaN;

    if (this.parametrization === 'alpha-beta') {
      let [alpha, beta] = params.slice(0, 2);

      if (alpha <= 0 || beta <= 0) return NaN;

      return Math.exp(lngamma(y + alpha)
                      - lngamma(alpha)
                      - lnfactorial(y)
                      + alpha * Math.log(beta / (1 + beta))
                      - y * Math.log(1 + beta));
    } else if (this.parametrization === 'mu-phi') {
      let [mu, phi] = params.slice(0, 2);
      
      if (mu <= 0 || phi <= 0) return NaN;

      let logMuPhi = Math.log(mu + phi);

      return Math.exp(lngamma(y + phi)
                      - lngamma(phi)
                      - lnfactorial(y)
                      + phi * (Math.log(phi) - logMuPhi)
                      + y * (Math.log(mu) - logMuPhi));
    } else if (this.parametrization === 'r-b') {
      let [r, b] = params.slice(0, 2);
      
      if (r <= 0 || b <= 0) return NaN;

      return Math.exp(lngamma(y + r)
                      - lngamma(r)
                      - lnfactorial(y)
                      + r * Math.log(1 / (1 + b))
                      - y * Math.log(1 + 1 / b));
    }
  }

  defaultXRange(params) {
    return super.ppf([0.001, 0.999], params)
  }

}


class PoissonDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return Infinity;
  }

  pmfSingleValue(n, params) {
    let lam = params[0];

    if (lam < 0) {
      return NaN;
    } else if (lam == 0) {
      if (n == 0) return 1.0;
      return 0.0;
    }

    return Math.exp(n * Math.log(lam) - lnfactorial(n) - lam);
  }

  defaultXRange(params) {
    return super.ppf([0.001, 0.999], params)
  }

}


class BetaDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of independent variable (used in quantile setter)
    this.varName = 'θ';

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['α', 'β'];
  }

  xMin(params) {
    return 0.0;
  }

  xMax(params) {
    return 1.0;
  }

  pdfSingleValue(x, params) {
    let [alpha, beta] = params.slice(0, 2);

    if (x < 0 || x > 1) return NaN;

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

  cdfSingleValue(x, params) {
    let [alpha, beta] = params.slice(0, 2);

    if (x <= 0) return 0.0;
    if (x >= 1) return 1.0;

    return regularizedIncompleteBeta(x, alpha, beta);
  }

  ppfSingleValue(p, params) {
    if (p == 0) return 0.0;
    if (p == 1) return 1.0;

    // Root finding function for ppf
    let rootFun = (x, params, p) => p - this.cdfSingleValue(x, params);
    
    return brentSolve(rootFun, 0.0, 1.0, [params, p]);
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    // Root finding function using log parameters to enforce positivity
    const quantileRootFindFunBeta = (params, x1, p1, x2, p2) => {
      let alpha = Math.exp(params[0]);
      let beta = Math.exp(params[1]);

      let r1 = this.cdfSingleValue(x1, [alpha, beta]) - p1;
      let r2 = this.cdfSingleValue(x2, [alpha, beta]) - p2;

      return [r1, r2];
    };

    let args = [x1, p1, x2, p2];
    let guess = [1.0, 1.0];
    let [logParams, optimSuccess] = findRootTrustRegion(quantileRootFindFunBeta, guess, args=args);

    return [[Math.exp(logParams[0]), Math.exp(logParams[1])], optimSuccess];
  }

  defaultXRange(params) {
    return [0.0, 1.0];
  }

}


class CauchyDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Specify name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['μ', 'σ'];
  }

  xMin(params) {
    return -Infinity;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    let [mu, sigma] = params.slice(0, 2);

    return 1.0 / Math.PI / sigma / (1 + Math.pow((x - mu) / sigma, 2))
  }

  cdfSingleValue(x, params) {
    let [mu, sigma] = params.slice(0, 2);

    return 0.5 + Math.atan((x - mu) / sigma) / Math.PI;
  }

  ppfSingleValue(p, params) {
    let [mu, sigma] = params.slice(0, 2);

    return mu + sigma * Math.tan(Math.PI * (p - 0.5));
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    let cotp1 = 1.0 / Math.tan(Math.PI * p1);
    let cotp2 = 1.0 / Math.tan(Math.PI * p2);

    let mu = (x2 * cotp1 - x1 * cotp2) / (cotp1 - cotp2);
    let sigma = (x1 - x2) * Math.sin(Math.PI * p1) * Math.sin(Math.PI * p1) 
                / Math.sin(Math.PI * (p1 - p2));

    return [[mu, sigma], true];
  }

  defaultXRange(params) {
    // Because of pathologically heavy tails, only go to 2.5th and 97.5th percentile
    return this.ppf([0.025, 0.975], params);
  }

}

class ExponentialDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Specify name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['β'];
  }

  xMin(params) {
    return 0.0;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    let beta = params[0];

    if (x < 0) return NaN;

    return beta * Math.exp(-beta * x);
  }

  cdfSingleValue(x, params) {
    let beta = params[0];

    if (x < 0) return 0.0;

    return 1 - Math.exp(-beta * x);
  }

  ppfSingleValue(p, params) {
    let beta = params[0];

    if (p == 0) return 0.0;
    if (p == 1) return Infinity;

    return -Math.log(1.0 - p) / beta;
  }

  quantileSet(x, p) {
    let x1 = x[0];
    let p1 = p[0];

    return [[-Math.log(1.0 - p1) / x1], true];
  }

  defaultXRange(params) {
    return [0.0, this.ppfSingleValue(0.999, params)];
  }

}

class GammaDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['α', 'β'];
  }

  xMin(params) {
    return 0.0;   
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x < 0) return NaN;

    let [alpha, beta] = params.slice(0, 2);

    let ln_prob;
    ln_prob = alpha * Math.log(beta * x) - Math.log(x) - beta * x - lngamma(alpha);

    return Math.exp(ln_prob);
  }

  cdfSingleValue(x, params) {
    if (x < 0) return 0.0;
    if (x == Infinity) return 1.0;

    let [alpha, beta] = params.slice(0, 2);

    return gammaincL(beta * x, alpha, true);
  }

  ppfSingleValue(p, params) {
    if (p == 0) return 0.0;
    if (p == 1) return Infinity;

    let rootFun = (xi, params, p) => {
        let x = xi == 1.0 ? Infinity : xi / (1.0 - xi);

        return p - this.cdfSingleValue(x, params);
    }

    let xiOpt = brentSolve(rootFun, 0.0, 1.0, [params, p]);

    return xiOpt == 1.0 ? Infinity : xiOpt / (1.0 - xiOpt);

  }

  defaultXRange(params) {
    let [x1, x2] = this.ppf([0.001, 0.999], params);

    // If lower bound is within 10% of the range of bounds to zero, make it zero
    if (x1 < (x2 - x1) / 10.0) x1 = 0.0;

    return [x1, x2];
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    // Rescale according to larger percentile
    let x1Rescaled = x1 / x2;
    let x2Rescaled = 1.0;

    // Root finding function using log parameters to enforce positivity
    const quantileRootFindFunGamma = (params, x1, p1, x2, p2) => {
      let alpha = Math.exp(params[0]);
      let beta = Math.exp(params[1]);

      let r1 = this.cdfSingleValue(x1, [alpha, beta]) - p1;
      let r2 = this.cdfSingleValue(x2, [alpha, beta]) - p2;

      return [r1, r2];
    };

    let args = [x1Rescaled, p1, x2Rescaled, p2];

    // Another option is to grid up guesses to get good initial guess.
    // // Grid up guesses
    // let alphaGuesses = linspace(-14, 10, 100);
    // let betaGuesses = linspace(-14, 10, 100);
    // let [alphaGrid, betaGrid] = meshgrid(alphaGuesses, betaGuesses);

    // // Evaluate function at each grid point and find smallest one
    // let fNorm = Infinity;
    // let newfNorm;
    // let guess;
    // for (let i = 0; i < alphaGrid.length; i++) {
    //   for (let j = 0; j < alphaGrid[i].length; j++) {
    //     newfNorm = norm(quantileRootFindFunGamma([alphaGrid[i][j], betaGrid[i][j]], x1, p1, x2, p2));
    //     if (newfNorm < fNorm) {
    //       fNorm = newfNorm;
    //       guess = [alphaGrid[i][j], betaGrid[i][j]];
    //     }
    //   }
    // }

    let guess = [0.75, 0.75];

    let [logParams, optimSuccess] = findRootTrustRegion(quantileRootFindFunGamma, guess, args=args);

    return [[Math.exp(logParams[0]), Math.exp(logParams[1]) / x2], optimSuccess];
  }

}

module.exports = { 
  DiscreteUnivariateDistribution,
  ContinuousUnivariateDistribution,
  BernoulliDistribution,
  BetaBinomialDistribution,
  BinomialDistribution,
  CategoricalDistribution,
  DiscreteUniformDistribution,
  GeometricDistribution,
  HypergeometricDistribution,
  NegativeBinomialDistribution,
  PoissonDistribution,
  BetaDistribution,
  CauchyDistribution,
  ExponentialDistribution,
  GammaDistribution
}



