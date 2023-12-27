class UnivariateDistribution {
  constructor() {
    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = [];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];
  }

  generateActiveFixedInds() {
    // Generate indices of active and fixed inidices for quantile setting
    this.activeParamsInds = [];
    this.fixedParamsInds = []
    for (let i = 0; i < this.paramNames.length; i++) {
      if (this.fixedParams.includes(this.paramNames[i])) {
        this.fixedParamsInds.push(i);
      } else {
        this.activeParamsInds.push(i);
      }
    }
  }

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

  quantileSet(x, p, extraParams = []) {
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

    // Name of distribution
    this.name = '';

    // Name of independent variable (used in quantile setter)
    this.varName = '';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = [];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()

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

  quantileSet(x, p, extraParams = []) {
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

    // Name of distribution
    this.name = '';

    // Name of independent variable (used in quantile setter)
    this.varName = '';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = [];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()

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

  quantileSet(x, p, extraParams = []) {
    // Must be specified.
  }

  // You should not respecify cdf, pdf, ppf; only specify the calculations for a single value.
}


class BernoulliDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Bernoulli';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = 1;

    // Parameter names, in order of params
    this.paramNames = ['θ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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
    else return NaN;
  }

  ppfSingleValue(p, params) {
    if (p <= params[0]) return 0;
    else return 1;
  }

  defaultXRange(params) {
    return [-0.2, 1.2];
  }

}


class BetaBinomialDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'BetaBinomial';

    // Name of independent variable (used in quantile setter)
    this.varName = 'n';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['N', 'α', 'β'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['N'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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

    // Name of distribution
    this.name = 'Binomial';

    // Name of independent variable (used in quantile setter)
    this.varName = 'n';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['N', 'θ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['N'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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

    // Name of distribution
    this.name = 'Categorical';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 1;
    this.hardMax = 4;

    // Parameter names, in order of params
    this.paramNames = ['θ1', 'θ2', 'θ3'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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
    return [-0.25, 4.25];
  }

  cdfSingleValue(x, params, xMin = 0) {
    // Override cdfSingleValue of superclass to plot NaNs if params are invalid
    let [theta1, theta2, theta3] = params.slice(0, 3);
    let theta4 = 1 - theta1 - theta2 - theta3

    // If the theta's don't sum to one, return NaN
    if (theta4 < 0) return NaN;

    // Compute CDF by summing up to x for which it is desired.
    let cumsum = 0.0;
    let summand = 0.0;
    for (let n = xMin; n <= x; n++) {
        summand = this.pmfSingleValue(n, params);
        if (!isNaN(summand)) cumsum += summand;
    }

    return cumsum;
  }
}


class DiscreteUniformDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'DiscreteUniform';

    // Name of independent variable (used in quantile setter)
    this.varName = '';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['low', 'high'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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

    // Name of distribution
    this.name = 'Geometric';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['θ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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

    // Name of distribution
    this.name = 'Hypergeometric';

    // Name of independent variable (used in quantile setter)
    this.varName = 'n';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['N', 'a', 'b'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['N'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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

    // Name of distribution
    this.name = 'NegativeBinomial';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    if (parametrization === undefined) {
      this.parametrization = 'alpha-beta'
    } else {
      this.parametrization = parametrization;
    }

    // Parameter names, in order of params
    if (this.parametrization === 'alpha-beta') {
      this.paramNames = ['α', 'β'];
    } else if (this.parametrization === 'mu-phi') {
      this.paramNames = ['µ', 'φ'];
    } else if (this.parametrization === 'r-b') {
      this.paramNames = ['r', 'b'];
    } else { // Some other, probably invalue parameters
      this.paramNames = ['unnamedParam1', 'unnamedParam2'];
    }

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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


class NegativeBinomialMuPhiDistribution extends NegativeBinomialDistribution {
  constructor() {
    super('mu-phi');
  }
}


class NegativeBinomialRBDistribution extends NegativeBinomialDistribution {
  constructor() {
    super('r-b');
  }
}


class PoissonDistribution extends DiscreteUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Poisson';

    // Name of independent variable (used in quantile setter)
    this.varName = 'n';  

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['λ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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

    // Name of distribution
    this.name = 'Beta';

    // Name of independent variable (used in quantile setter)
    this.varName = 'θ';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = 1;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['α', 'β'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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
        } else if (alpha > 1) {
            return 0.0;
        } else {
            return Infinity;
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
            return Infinity;
        }
    }

    let lnProb = (alpha - 1.0) * Math.log(x) + (beta - 1.0) * Math.log(1.0 - x) - lnbeta(alpha, beta);

    return Math.exp(lnProb);
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
    const quantileRootFun = (params, x1, p1, x2, p2) => {
      let alpha = Math.exp(params[0]);
      let beta = Math.exp(params[1]);

      let r1 = this.cdfSingleValue(x1, [alpha, beta]) - p1;
      let r2 = this.cdfSingleValue(x2, [alpha, beta]) - p2;

      return [r1, r2];
    };

    let args = [x1, p1, x2, p2];
    let guess = [1.0, 1.0];
    let [logParams, optimSuccess] = findRootTrustRegion(quantileRootFun, guess, args=args);

    return [[Math.exp(logParams[0]), Math.exp(logParams[1])], optimSuccess];
  }

  defaultXRange(params) {
    return [0.0, 1.0];
  }

}


class CauchyDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Cauchy';

    // Specify name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['μ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return -Infinity;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x == Infinity || x == -Infinity) return 0.0;

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

  defaultXRange(params) {
    // Because of pathologically heavy tails, only go to 2.5th and 97.5th percentile
    return this.ppf([0.025, 0.975], params);
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
}

class ExponentialDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Exponential';

    // Specify name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['β'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
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
    if (x == Infinity) return 0.0;

    return beta * Math.exp(-beta * x);
  }

  cdfSingleValue(x, params) {
    let beta = params[0];

    if (x < 0) return 0.0;
    if (x == Infinity) return 0.0;

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

    // Name of distribution
    this.name = 'Gamma';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['α', 'β'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return 0.0;   
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x < 0) return NaN;
    if (x == Infinity) return 0.0;

    let [alpha, beta] = params.slice(0, 2);

    if (x == 0) {
      if (alpha == 1) {
        return beta;
      } else if (alpha > 1) {
        return 0.0;
      } else {  // alpha < 1
        return Infinity;
      }
    }

    let lnProb;
    lnProb = alpha * Math.log(beta * x) - Math.log(x) - beta * x - lngamma(alpha);

    return Math.exp(lnProb);
  }

  cdfSingleValue(x, params) {
    if (x <= 0) return 0.0;
    if (x == Infinity) return 1.0;

    let [alpha, beta] = params.slice(0, 2);

    return gammaincL(beta * x, alpha, true);
  }

  ppfSingleValue(p, params) {
    if (p === 0) return 0.0;
    if (p === 1) return Infinity;

    // Recale params
    let rescaledParams = [params[0], 1.0];

    let rootFun = (xi, params, p) => {
        let x = xi == 1.0 ? Infinity : xi / (1.0 - xi);

        return p - this.cdfSingleValue(x, params);
    }

    let xiOpt = brentSolve(rootFun, 0.0, 1.0, [rescaledParams, p]);

    // If we got close to infinity, return
    if (xiOpt === 1) {
      return Infinity;
    }

    // Zero in on solution without transformation using Newton's (secant) method
    let xFirstPass = xiOpt / (1.0 - xiOpt);

    let closeRootFun = (x, params, p) => {
      return p - this.cdfSingleValue(x, params);
    }

    let xOpt = secantSolve(xFirstPass, closeRootFun, [rescaledParams, p]);

    let retval;
    if (xOpt != null && closeRootFun(xOpt, rescaledParams, p) < closeRootFun(xFirstPass, rescaledParams, p)) {
      retval = xOpt;
    } else {
      retval = xFirstPass;
    }

    // Return with proper rescaling
    return retval / params[1];
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
    const quantileRootFun = (params, x1, p1, x2, p2) => {
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
    //     newfNorm = norm(quantileRootFun([alphaGrid[i][j], betaGrid[i][j]], x1, p1, x2, p2));
    //     if (newfNorm < fNorm) {
    //       fNorm = newfNorm;
    //       guess = [alphaGrid[i][j], betaGrid[i][j]];
    //     }
    //   }
    // }

    let guess = [0.75, 0.75];

    let [logParams, optimSuccess] = findRootTrustRegion(quantileRootFun, guess, args=args);

    // Convert from log params
    let paramsFirstPass = [Math.exp(logParams[0]), Math.exp(logParams[1])];

    // If we failed, just return with message about bad success.
    if (!optimSuccess) {
      return [[paramsFirstPass[0], paramsFirstPass[1]], optimSuccess];
    }

    // Hone in on solution by now dropping transformation
    const closeQuantileRootFun = (params, x1, p1, x2, p2) => {
      let r1 = this.cdfSingleValue(x1, params) - p1;
      let r2 = this.cdfSingleValue(x2, params) - p2;

      return [r1, r2];
    };

    let paramsOpt;
    [paramsOpt, optimSuccess] = findRootTrustRegion(closeQuantileRootFun, paramsFirstPass, args=args);

    let retval;
    if (optimSuccess && norm(closeQuantileRootFun(paramsOpt, x1, p1, x2, p2)) < norm(closeQuantileRootFun(paramsFirstPass, x1, p1, x2, p2))) {
      retval = paramsOpt;
    } else {
      retval = paramsFirstPass;
    }

    // Return result with proper scaling
    return [[retval[0], retval[1] / x2], optimSuccess];
  }

}

class HalfCauchyDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'HalfCauchy';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['µ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['µ'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return params[0];
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    let [mu, sigma] = params.slice(0, 2);

    if (x < mu) return NaN;
    if (x === Infinity) return 0.0;

    return 2.0 / Math.PI / sigma / (1 + Math.pow((x - mu) / sigma, 2));
  }

  cdfSingleValue(x, params) {
    let [mu, sigma] = params.slice(0, 2);

    if (x <= mu) return 0.0;
    if (x === Infinity) return 1.0;

    return 2.0 * Math.atan((x - mu) / sigma) / Math.PI;
  }

  ppfSingleValue(p, params) {
    let [mu, sigma] = params.slice(0, 2);

    return mu + sigma * Math.tan(Math.PI * p / 2.0);
  }

  defaultXRange(params) {
    // Because of pathologically heavy tails, only go to 90th percentile
    return [params[0], this.ppf(0.9, params)];
  }

  quantileSet(x, p, extraParams) {
    let x1 = x[0];
    let p1 = p[0];
    let mu = extraParams[0];

    return [[(x1 - mu) / Math.tan(Math.PI * p1 / 2)], true];
  }
}

class HalfNormalDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'HalfNormal';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['µ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['µ'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return params[0];
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    let [mu, sigma] = params.slice(0, 2);

    if (x < mu) return NaN;
    if (x === Infinity) return 0.0;

    let expTerm = (Math.pow(x - mu, 2) / 2.0 / Math.pow(sigma, 2));
    return Math.exp(-expTerm) / sigma * Math.sqrt(2.0 / Math.PI);
  }

  cdfSingleValue(x, params) {
    let [mu, sigma] = params.slice(0, 2);

    if (x <= mu) return 0.0;
    if (x === Infinity) return 1.0;

    return erf((x - mu) / sigma / Math.sqrt(2));
  }

  ppfSingleValue(p, params) {
    let [mu, sigma] = params.slice(0, 2);
    let sqrt2 = 1.4142135623730951;

    return mu + sqrt2 * sigma * erfinv(p);
  }

  defaultXRange(params) {
    return [params[0], this.ppf(0.999, params)];
  }

  quantileSet(x, p, extraParams) {
    let x1 = x[0];
    let p1 = p[0];
    let mu = extraParams[0];

    let sqrt2 = 1.4142135623730951;

    return [[(x1 - mu) / sqrt2 / erfinv(p1)], true];
  }
}

class HalfStudentTDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'HalfStudentT';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['ν', 'µ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['ν', 'µ'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return params[1];
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    let [nu, mu, sigma] = params.slice(0, 3);

    if (x < mu) return NaN;
    if (x === Infinity) return 0.0;

    let lnprob;

    lnprob = Math.log(2.0) + lngamma((nu + 1) / 2) - lngamma(nu / 2) - Math.log(Math.PI * nu) / 2 
             - Math.log(sigma) - (nu + 1) / 2 * log1p(Math.pow(x - mu, 2) / nu / Math.pow(sigma, 2));

    return Math.exp(lnprob);
  }

  cdfSingleValue(x, params) {
    let [nu, mu, sigma] = params.slice(0, 3);

    if (x <= mu) return 0.0;
    if (x === Infinity) return 1.0;

    let y = (x - mu) / sigma;

    return 1 - regularizedIncompleteBeta(nu / (Math.pow(y, 2) + nu), 0.5 * nu, 0.5);
  }

  ppfSingleValue(p, params) {
    if (p === 0) return params[1];
    if (p === 1) return Infinity;

    let studentT = new StudentTDistribution();
    return studentT.ppf((1 + p) / 2, params);
  }

  defaultXRange(params) {
    return [params[0], this.ppf(0.999, params)];
  }

  quantileSet(x, p, extraParams) {
    let [nu, mu] = extraParams;

    // Treat special cases
    if (nu === 1) { // Cauchy
      let halfCauchy = new HalfCauchyDistribution();
      return halfCauchy.quantileSet(x, p, [mu]);
    }
    if (nu === Infinity) { // Normal
      let halfNormal = new HalfNormalDistribution();
      return halfNormal.quantileSet(x, p, [mu]);
    }

    let x1 = x[0];
    let p1 = p[0];

    // Root finding function using log sigma to enforce positivity
    const quantileRootFun = (params, nu, mu, x1, p1) => {
      let sigma = Math.exp(params[0]);

      return [this.cdfSingleValue(x1, [nu, mu, sigma]) - p1];
    };

    let args = [nu, mu, x1, p1];

    // To get guess, use either Cauchy or Normal
    let guess;
    let guessSuccess;
    if (nu < 3) {
      let halfCauchy = new HalfCauchyDistribution();
      [guess, guessSuccess] = halfCauchy.quantileSet(x, p, [mu]);
    } else {
      let halfNormal = new HalfNormalDistribution();
      [guess, guessSuccess] = halfNormal.quantileSet(x, p, [mu]);      
    }

    // Convert guess to have log of sigma, since that's the transformation we use
    guess = [Math.log(guess[0])];

    let [paramsFirstPass, optimSuccess] = findRootTrustRegion(quantileRootFun, guess, args=args);

    // Convert to sigma from log sigma
    paramsFirstPass[0] = Math.exp(paramsFirstPass[0]);

    // If we failed, just return with message about bad success.
    if (!optimSuccess) {
      return [[paramsFirstPass[0]], optimSuccess];
    }

    // Hone in on solution by now dropping transformation
    const closeQuantileRootFun = (params, nu, mu, x1, p1) => {
      let sigma = params[0];

      return [this.cdfSingleValue(x1, [nu, mu, sigma]) - p1];
    };

    let paramsOpt;
    [paramsOpt, optimSuccess] = findRootTrustRegion(closeQuantileRootFun, paramsFirstPass, args=args);

    let retval;
    if (optimSuccess && norm(closeQuantileRootFun(paramsOpt, nu, x1, p1)) < norm(closeQuantileRootFun(paramsFirstPass, nu, x1, p1))) {
      retval = [paramsOpt, optimSuccess];
    } else {
      retval = [paramsOpt, optimSuccess];
    }

    return retval;
  }
}

class InverseGammaDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'InverseGamma';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['α', 'β'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return 0.0;   
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x < 0) return NaN;
    if (x === 0 || x === Infinity) return 0.0;

    let [alpha, beta] = params.slice(0, 2);

    let lnProb;
    lnProb = alpha * Math.log(beta) - (alpha + 1) * Math.log(x) - beta / x - lngamma(alpha);

    return Math.exp(lnProb);
  }

  cdfSingleValue(x, params) {
    if (x <= 0) return 0.0;
    if (x == Infinity) return 1.0;

    let [alpha, beta] = params.slice(0, 2);

    return gammaincU(beta / x, alpha, true);
  }

  ppfSingleValue(p, params) {
    if (p === 0) return 0.0;
    if (p === 1) return Infinity;

    let gamma = new GammaDistribution();
    return 1.0 / gamma.ppf(1.0 - p, params);
  }

  defaultXRange(params) {
    // Due to very heavy right tail, only go to 99th percentile
    let [x1, x2] = this.ppf([0.001, 0.99], params);

    // If lower bound is within 10% of the range of bounds to zero, make it zero
    if (x1 < (x2 - x1) / 10.0) x1 = 0.0;

    return [x1, x2];
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);

    let gamma = new GammaDistribution();
    return gamma.quantileSet([1.0 / x2, 1.0 / x1], p);
  }

}


class LogNormalDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'LogNormal';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['μ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
}

  xMin(params) {
    return 0.0;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x < 0.0) return NaN;
    if (x === 0) return 0.0;
    if (x === Infinity) return 0.0;

    let [mu, sigma] = params.slice(0, 2);
    let expTerm = (Math.pow(Math.log(x) - mu, 2) / 2.0 / Math.pow(sigma, 2))
    return Math.exp(-expTerm) / x / sigma / Math.sqrt(2 * Math.PI);
  }

  cdfSingleValue(x, params) {
    if (x <= 0) return 0.0;
    if (x === Infinity) return 1.0;

    let [mu, sigma] = params.slice(0, 2);
    return (1 + erf((Math.log(x) - mu) / sigma / Math.sqrt(2))) / 2;
  }

  ppfSingleValue(p, params) {
    if (p === 0) return 0.0;
    if (p === 1) return Infinity;

    let [mu, sigma] = params.slice(0, 2);
    let sqrt2 = 1.4142135623730951;

    return Math.exp(mu + sqrt2 * sigma * erfinv(2 * p - 1));
  }

  defaultXRange(params) {
    // Due to very heavy right tail, only go to 99th percentile
    let [x1, x2] = this.ppf([0.001, 0.99], params);

    // If lower bound is within 10% of the range of bounds to zero, make it zero
    if (x1 < (x2 - x1) / 10.0) x1 = 0.0;

    return [x1, x2];
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);
    let [logx1, logx2] = [Math.log(x1), Math.log(x2)];

    let sqrt2 = 1.4142135623730951;

    let sigmaCoeff1 = sqrt2 * erfinv(2 * p1 - 1);
    let sigmaCoeff2 = sqrt2 * erfinv(2 * p2 - 1);

    let sigma = (logx2 - logx1) / (sigmaCoeff2 - sigmaCoeff1);
    let mu = logx2 - sigmaCoeff2 * sigma;

    return [[mu, sigma], true];
  }
}


class NormalDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Normal';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['μ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
}

  xMin(params) {
    return -Infinity;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x === -Infinity || x === Infinity) return 0.0;

    let [mu, sigma] = params.slice(0, 2);

    let expTerm = (Math.pow(x - mu, 2) / 2.0 / Math.pow(sigma, 2));
    return Math.exp(-expTerm) / sigma / Math.sqrt(2 * Math.PI);
  }

  cdfSingleValue(x, params) {
    if (x === -Infinity) return 0.0;
    if (x === Infinity) return 1.0;

    let [mu, sigma] = params.slice(0, 2);

    return (1 + erf((x - mu) / sigma / Math.sqrt(2))) / 2;
  }

  ppfSingleValue(p, params) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;

    let [mu, sigma] = params.slice(0, 2);
    let sqrt2 = 1.4142135623730951;

    return mu + sqrt2 * sigma * erfinv(2 * p - 1);
  }

  defaultXRange(params) {
    return this.ppf([0.001, 0.999], params);
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    let sqrt2 = 1.4142135623730951;

    let sigmaCoeff1 = sqrt2 * erfinv(2 * p1 - 1);
    let sigmaCoeff2 = sqrt2 * erfinv(2 * p2 - 1);

    let sigma = (x2 - x1) / (sigmaCoeff2 - sigmaCoeff1);
    let mu = x2 - sigmaCoeff2 * sigma;

    return [[mu, sigma], true];
  }
}


class ParetoDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Pareto';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['yₘᵢₙ', 'α'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return params[0];    
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    let [ymin, alpha] = params.slice(0, 2);

    if (x < ymin) return NaN;
    if (x === Infinity) return 0.0;

    let logp = Math.log(alpha) + alpha * Math.log(ymin) - (alpha + 1) * Math.log(x); 
    return Math.exp(logp);
  }

  cdfSingleValue(x, params) {
    let [ymin, alpha] = params.slice(0, 2);

    if (x <= ymin) return 0.0;
    if (x === Infinity) return 1.0;

    return 1 - Math.pow(ymin / x, alpha);
  }

  ppfSingleValue(p, params) {
    let [ymin, alpha] = params.slice(0, 2);

    if (p === 0) return ymin;
    if (p === 1) return Infinity;

    return ymin * Math.pow(1.0 / (1.0 - p), 1.0 / alpha);
  }

  defaultXRange(params) {
    // Show until PDF gets to 1/100 of max.
    let [ymin, alpha] = params.slice(0, 2);

    let p = 0.01;

    let x1 = ymin;
    let logx2 = Math.log(ymin) - Math.log(p) / (1 + alpha);
    let x2 = Math.exp(logx2);

    return [x1, x2];
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    let alpha = (Math.log(1.0 - p1) - Math.log(1.0 - p2)) / (Math.log(x2) - Math.log(x1));
    let ymin = Math.exp(Math.log(1 - p2) / alpha + Math.log(x2));

    return [[ymin, alpha], true];
  }
}


class StudentTDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'StudentT';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Name of parameters (may be used in quantile setter)
    this.paramNames = ['ν', 'μ', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['ν'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return -Infinity;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x === -Infinity || x === Infinity) return 0.0;

    let [nu, mu, sigma] = params.slice(0, 3);

    let lnprob;

    lnprob = lngamma((nu + 1) / 2) - lngamma(nu / 2) - Math.log(Math.PI * nu) / 2 - Math.log(sigma)
             - (nu + 1) / 2 * log1p(Math.pow(x - mu, 2) / nu / Math.pow(sigma, 2));

    return Math.exp(lnprob);
  }

  cdfSingleValue(x, params) {
    if (x === -Infinity) return 0.0;
    if (x === Infinity) return 1.0;

    let [nu, mu, sigma] = params.slice(0, 3);

    let y = (x - mu) / sigma;

    if (y >= 0) {
        return 1 - regularizedIncompleteBeta(nu / (Math.pow(y, 2) + nu), 0.5 * nu, 0.5) / 2;
    }
    else {
        return regularizedIncompleteBeta(nu / (Math.pow(y, 2) + nu), 0.5 * nu, 0.5) / 2;        
    }
  }

  ppfSingleValue(p, params) {
    let [nu, mu, sigma] = params.slice(0, 3);

    // Guess based on Cauchy or Normal
    let guess;
    if (nu < 3) { // Cauchy
      guess = Math.tan(Math.PI * (p - 0.5));
    } else {
      guess = Math.sqrt(2) * erfinv(2 * p - 1)
    }

    // Return is we match special cases
    if (nu === 1 || nu === Infinity) return mu + sigma * guess;

    // Use trust region to compute ppf
    let rootFun = (x, nu, p) => [p - this.cdfSingleValue(x, [nu, 0, 1])];
    let [xOpt, success] = findRootTrustRegion(rootFun, [guess], [nu, p]);

    return mu + sigma * xOpt[0];
  }

  defaultXRange(params) {
    // Adjust default ranges depending on weight of tails
    let [nu, mu, sigma] = params.slice(0, 3);

    let p1;
    let p2;

    if (nu < 2) {
        p1 = 0.05;
        p2 = 0.95;
    }
    if (nu < 4) {
        p1 = 0.01;
        p2 = 0.99;
    }
    else if (nu < 10) {
        p1 = 0.005;
        p2 = 0.995;
    }
    else {
        p1 = 0.001;
        p2 = 0.999;
    }

    return this.ppf([p1, p2], params);
  }

  quantileSet(x, p, extraParams) {
    // For Student-t, nu is locked in, adjust mu and sigma. Cannot specify three quantiles
    // and get three parameters. As an example, say we have x = [-1, 0, 2] and
    // p = [0.2, 0.5, 0.8]. The Student-t distribution is symmetric, so it is not possible
    // to have quantiles an equal distance from 0.5 have different x-values.

    let nu = extraParams[0];

    // Treat specical cases
    if (nu === 1) { // Cauchy
      let cauchy = new CauchyDistribution();
      return cauchy.quantileSet(x, p);
    }
    if (nu === Infinity) { // Normal
      let normal = new NormalDistribution();
      return normal.quantileSet(x, p);
    }

    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    // Root finding function using log sigma to enforce positivity
    const quantileRootFun = (params, nu, x1, p1, x2, p2) => {
      let mu = params[0];
      let sigma = Math.exp(params[1]);

      let r1 = this.cdfSingleValue(x1, [nu, mu, sigma]) - p1;
      let r2 = this.cdfSingleValue(x2, [nu, mu, sigma]) - p2;

      return [r1, r2];
    };

    let args = [nu, x1, p1, x2, p2];

    // To get guess, use either Cauchy or Normal
    let guess;
    let guessSuccess;
    if (nu < 3) {
      let cauchy = new CauchyDistribution();
      [guess, guessSuccess] = cauchy.quantileSet(x, p);
    } else {
      let normal = new NormalDistribution();
      [guess, guessSuccess] = normal.quantileSet(x, p);      
    }

    // Convert guess to have log of sigma, since that's the transformation we use
    guess = [guess[0], Math.log(guess[1])];

    let [paramsFirstPass, optimSuccess] = findRootTrustRegion(quantileRootFun, guess, args=args);

    // Convert to sigma from log sigma
    paramsFirstPass[1] = Math.exp(paramsFirstPass[1]);

    // If we failed, just return with message about bad success.
    if (!optimSuccess) {
      return [[paramsFirstPass[0], paramsFirstPass[1]], optimSuccess];
    }

    // Hone in on solution by now dropping transformation
    const closeQuantileRootFun = (params, nu, x1, p1, x2, p2) => {
      let [mu, sigma] = params.slice(0, 2);

      let r1 = this.cdfSingleValue(x1, [nu, mu, sigma]) - p1;
      let r2 = this.cdfSingleValue(x2, [nu, mu, sigma]) - p2;

      return [r1, r2];
    };

    let paramsOpt;
    [paramsOpt, optimSuccess] = findRootTrustRegion(closeQuantileRootFun, paramsFirstPass, args=args);

    let retval;
    if (optimSuccess && norm(closeQuantileRootFun(paramsOpt, nu, x1, p1, x2, p2)) < norm(closeQuantileRootFun(paramsFirstPass, nu, x1, p1, x2, p2))) {
      retval = [paramsOpt, optimSuccess];
    } else {
      retval = [paramsOpt, optimSuccess];
    }

    return retval;
  }

}

class UniformDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Uniform';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Infinity;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['α', 'β'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return params[0];    
  }

  xMax(params) {
    return params[1];    
  }

  pdfSingleValue(x, params) {
    let [alpha, beta] = params.slice(0, 2);
    
    if (beta <= alpha || x < alpha || x > beta) return NaN;

    return 1.0 / (beta - alpha);
  }

  cdfSingleValue(x, params) {
    let [alpha, beta] = params.slice(0, 2);

    if (beta <= alpha) return NaN;

    if (x <= alpha) return 0.0;
    if (x >= beta) return 1.0;

    return (x - alpha) / (beta - alpha);
  }

  ppfSingleValue(p, params) {
    let [alpha, beta] = params.slice(0, 2);

    if (beta <= alpha) return NaN;

    return alpha + p * (beta - alpha);
  }

  defaultXRange(params) {
    let [alpha, beta] = params.slice(0, 2);

    if (beta <= alpha) return [0, 1];

    let d = beta - alpha;
    
    return[alpha - d * 0.1, beta + d * 0.1];
  }

  quantileSet(x, p, extraParams = []) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    let alpha = (p2 * x1 - p1 * x2) / (p2 - p1);
    let beta = alpha + (x2 - x1) / (p2 - p1);

    return [[alpha, beta], true];
  }
}


class WeibullDistribution extends ContinuousUnivariateDistribution {
  constructor() {
    super();

    // Name of distribution
    this.name = 'Weibull';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0.0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    this.paramNames = ['α', 'σ'];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return 0.0;
  }

  xMax(params) {
    return Infinity;
  }

  pdfSingleValue(x, params) {
    if (x < 0) return NaN;
    if (x === 0) return 0.0;
    if (x === Infinity) return 0.0;

    let [alpha, sigma] = params.slice(0, 2);

    let logp = -Math.pow(x / sigma, alpha) + (alpha - 1) * Math.log(x) 
                + Math.log(alpha) - alpha * Math.log(sigma);

    return Math.exp(logp);
  }

  cdfSingleValue(x, params) {
    if (x <= 0) return 0.0;
    if (x === Infinity) return 1.0;

    let [alpha, sigma] = params.slice(0, 2);

    return 1 - Math.exp(-Math.pow(x / sigma, alpha));
  }

  ppfSingleValue(p, params) {
    if (p === 0) return 0.0;
    if (p === 1) return Infinity;

    let [alpha, sigma] = params.slice(0, 2);

    return sigma * Math.pow(-Math.log(1.0 - p), 1.0 / alpha);
  }

  defaultXRange(params) {
    let [x1, x2] = this.ppf([0.001, 0.999], params);

    // If lower bound is within 10% of the range of bounds to zero, make it zero
    if (x1 < (x2 - x1) / 10.0) x1 = 0.0;

    return [x1, x2];
  }

  quantileSet(x, p, extraParams = []) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    let loglog1 = Math.log(-Math.log(1.0 - p1));
    let loglog2 = Math.log(-Math.log(1.0 - p2));
    let logx1 = Math.log(x1);
    let logx2 = Math.log(x2);

    let alpha = (loglog2 - loglog1) / (logx2 - logx1);
    let sigma = Math.exp(logx2 - loglog2 / alpha);

    return [[alpha, sigma], true];
  }

  // You should not respecify cdf, pdf, ppf; only specify the calculations for a single value.
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
  GammaDistribution,
  HalfCauchyDistribution,
  HalfNormalDistribution,
  HalfStudentTDistribution,
  InverseGammaDistribution,
  LogNormalDistribution,
  NormalDistribution,
  ParetoDistribution,
  StudentTDistribution,
  UniformDistribution,
  WeibullDistribution,
}



