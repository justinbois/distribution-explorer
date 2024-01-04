class UnivariateDistribution {
  constructor(parametrization) {
    // Name of distribution
    this.name = '';

    // Name of independent variable (used in quantile setter)
    this.varName = '';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // x-value when quantile = 1
    this.p1Value = Infinity;

    // Name of specific parametrization
    this.parametrization = parametrization

    // Parameter names, in order of params
    this.paramNames = [];

    // Location parameter, if any (always undefined for discrete)
    this.locationParam = undefined;
    this.locatonParamIndex = undefined;

    // Parameter minima
    this.paramMin = [];

    // Parameter maxima
    this.paramMax = [];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Small number for nudging parameters
    this.epsilon = 1.0e-8;
  }

  generateLocationParamIndex() {
    if (this.locationParam === undefined) {
      this.locationParamInd = undefined;
    } else {
      this.locationParamInd = this.paramNames.indexOf(this.locationParam);
    }
  }

  generateActiveFixedInds() {
    // Generate indices of active and fixed indices for quantile setting
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

  xMin(params, parametrization = this.parametrization) {
    // Minimal value of support; defined for each distribution and possibly dependent on parameter values.
  }

  xMax(params, parametrization = this.parametrization) {
    // Maximal value of support; defined for each distribution and possibly dependent on parameter values.
  }

  cdfSingleValue({x, params, parametrization = this.parametrization}) {
    // Empty; defined for each distribution.
  }

  ppfSingleValue(p, params, parametrization = this.parametrization) {
    // Empty; defined for each distribution.
  }

  quantileSet(x, p, parametrization = this.parametrization) {
    // Empty; defined for each distribution.
  }

  defaultXRange(params, parametrization = this.parametrization) {
    // Default x-range for reset button. Empty; defined for each distribution.
  }


  cdf(x, params, parametrization = this.parametrization) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (x, params) => this.cdfSingleValue(x, params, parametrization),
      x,
      params
    );
  }

  ppfSingleValueWithCheck(p, params, parametrization = this.parametrization) {
    if (p < 0 || p > 1) return NaN;
    return this.ppfSingleValue(p, params, parametrization);
  }

  ppf(p, params, parametrization = this.parametrization) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (p, params) => this.ppfSingleValueWithCheck(p, params, parametrization),
      p,
      params
    );
  }

  resetXRange(params, p, parametrization = this.parametrization) {
    if (p === undefined) {
      return this.defaultXRange(params, parametrization);
    } else if (this.checkResetp(p)) {
      return this.ppf(p, params, parametrization);
    }
  }

  scalarOrArrayCompute(func, x, params, parametrization = this.parametrization) {
    if (x instanceof Array) {
      let xLen = x.length;

      let res = [];
      for (let i = 0; i < xLen; i++) {
        res.push(func(x[i], params, parametrization));
      }

      return res;
    } else {
      return func(x, params, parametrization);
    }
  }

  scalarToArrayParams(params) {
    return params instanceof Array ? params : [params]
  }
}


class DiscreteUnivariateDistribution extends UnivariateDistribution {
  constructor(parametrization) {
    super(parametrization);
  }

  pmfSingleValue(x, params, parametrization = this.parametrization) {
    // Empty; defined for each distribution.
  }

  pmf(x, params, parametrization = this.parametrization) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (x, params) => this.pmfSingleValue(x, params, parametrization),
      x,
      params);
  }

  cdfSingleValue(x, params, parametrization = this.parametrization) {
    params = this.scalarToArrayParams(params);

    // Compute CDF by summing up to x for which it is desired.
    let cumsum = 0.0;
    let summand = 0.0;
    for (let n = this.xMin(params, parametrization); n <= x; n++) {
        summand = this.pmfSingleValue(n, params, parametrization);
        if (!isNaN(summand)) cumsum += summand;
    }

    return cumsum;
  }

  cdfForPlotting(xStart, xEnd, params, parametrization = this.parametrization) {
    // This is a faster CDF for plotting, since it is assumed that
    // values for the CDF are wanted at all integer values between
    // xStart and xEnd, inclusive. Values of the CDF are also repeated
    // so that the CDF has a staircase look. 
    params = this.scalarToArrayParams(params);

    // Compute CDF by summing up to first value of x for which it is desired.
    let cumsum = 0.0;
    let prob;
    for (let x = this.xMin(params, parametrization); x < xStart; x++) {
      prob = this.pmfSingleValue(x, params, parametrization);
      if (!isNaN(prob)) cumsum += prob;
    }

    // Now start building CDF.
    let yCDF = [];
    for (let x = xStart; x < xEnd; x++) {
      prob = this.pmfSingleValue(x, params, parametrization);
      if (!isNaN(prob)) cumsum += prob;
      yCDF.push(cumsum, cumsum);
    }

    return yCDF;
  }

  ppfSingleValue(p, params, parametrization = this.parametrization) {
    if (p < 0 || p > 1) throw new Error('p must be between 0 and 1.')

    // ppf is minimum value of x such that F(x) ≥ p where F(x) is the CDF
    if (p == 0) return xMin(params, parametrization);

    // If asking for for p = 1, return prescribed value
    if (p == 1) return xMax(params, parametrization);

    params = this.scalarToArrayParams(params);

    // Initialize
    let n = this.xMin(params, parametrization);
    let cumsum = this.pmfSingleValue(n, params, parametrization);

    let iters = 0;
    let summand = 0.0;
    let xMaxForTheseParams = this.xMax(params, parametrization);
    while (cumsum < p && !isclose(cumsum, p) && !isNaN(summand) && n < xMaxForTheseParams) {
      n += 1;
      summand = this.pmfSingleValue(n, params, parametrization);

      if (!isNaN(summand)) cumsum += summand;

      iters += 1;
    }

    return n;
  }

}


class ContinuousUnivariateDistribution extends UnivariateDistribution {
  constructor(parametrization) {
    super(parametrization);
  }

  pdfSingleValue(x, params, parametrization = this.parametrization) {
    // Empty; defined for each distribution.
  }

  pdf(x, params, parametrization = this.parametrization) {
    params = this.scalarToArrayParams(params);

    return this.scalarOrArrayCompute(
      (x, params) => this.pdfSingleValue(x, params, parametrization),
      x,
      params
    );
  }

}


class TemplateDiscreteUnivariateDistribution extends DiscreteUnivariateDistribution {
  // Only add parametrization argument to constructor() and super() in the next two lines
  // if you need to define it (i.e., more than one possibility)
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

    // Parameter minima
    this.paramMin = [];

    // Parameter maxima
    this.paramMax = [];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()

    // Can have more specifications in the constructor.
  }

  xMin(params, parametrization = this.parametrization) {
    // Must be specified.    
  }

  xMax(params, parametrization = this.parametrization) {
    // Must be specified.    
  }

  pmfSingleValue(x, params, parametrization = this.parametrization) {
    // Must be specified.
  }

  defaultXRange(params, parametrization = this.parametrization) {
    // Must be specified.
  }

  quantileSet(x, p, extraParams = [], parametrization = this.parametrization) {
    // Must be specified.
  }

  // CDF and PPF are automatically computed in the superclass. These can be overrided by
  // specifying:
  //   cdfSingleValue(x, params, parametrization = this.parametrization)
  //   ppfSingleValue(p, params, parametrization = this.parametrization)
  //
  // Note that cdfSingleValue will *not* be used to compute the CDF for plotting. That is
  // done from the PMF, which is usually more efficient. The cdfSingleValue is really only
  // used in quantile setting.
  // You should not respecify cdf, pmf, ppf; only specify the calculations for a single value.
}


class TemplateContinuousUnivariateDistribution extends ContinuousUnivariateDistribution {
  // Only add parametrization argument to constructor() and super() in the next two lines
  // if you need to define it (i.e., more than one possibility)
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

    // Location parameter, if any
    this.locationParam = undefined;

    // Parameter minima
    this.paramMin = [];

    // Parameter maxima
    this.paramMax = [];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();

    // Can have more specifications in the constructor.
  }

  xMin(params, parametrization = this.parametrization) {
    // Must be specified.    
  }

  xMax(params, parametrization = this.parametrization) {
    // Must be specified.    
  }

  pdfSingleValue(x, params, parametrization = this.parametrization) {
    // Must be specified.
  }

  cdfSingleValue(x, params, parametrization = this.parametrization) {
    // Must be specified.
  }

  ppfSingleValue(p, params, parametrization = this.parametrization) {
    // Must be specified.
  }

  defaultXRange(params, parametrization = this.parametrization) {
    // Must be specified.
  }

  quantileSet(x, p, extraParams = [], parametrization = this.parametrization) {
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

    // Parameter minima
    this.paramMin = [0.0];

    // Parameter maxima
    this.paramMax = [1.0];

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

  quantileSet(x, p, extraParams) {
    let x1 = x[0];
    let p1 = p[0];

    if (x1 != 0) {
      throw new Error(this.varName + ' must be zero.')
    }

    return [[1 - p1], true];
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

    // Parameter minima
    this.paramMin = [0, 0.0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, 1.0, 1.0];

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

    // Parameter minima
    this.paramMin = [0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, 1.0];

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

  cdfSingleValue(n, params) {
    let [N, theta] = params.slice(0, 2);

    if (n < 0) return 0.0;
    if (n >= N) return 1.0;
    return regularizedIncompleteBeta(1.0 - theta, N - n, n + 1);
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

  quantileSet(x, p, extraParams) {
    let x1 = x[0];
    let p1 = p[0];
    let N = extraParams[0];

    if (!Number.isInteger(x1)) {
      throw new Error(this.varName + ' must be integer.')
    }
    if (x1 < 0) {
      throw new Error('Must have ' + this.varName + ' > 0.')
    }
    if (x1 >= N) {
      throw new Error('Must have ' + this.varName + ' < N.')
    }

    // Root finding function for quantile
    let rootFun = (theta, N) => p1 - this.cdfSingleValue(x1, [N, theta]);

    let thetaOpt = brentSolve(rootFun, 0.0, 1.0, [N]);
    let optimSuccess = thetaOpt != null;
    
    return [[thetaOpt], optimSuccess];
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

    // Parameter minima
    this.paramMin = [0.0, 0.0, 0.0];

    // Parameter maxima
    this.paramMax = [1.0, 1.0, 1.0];

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

    // Parameter minima
    this.paramMin = [-Infinity, -Infinity];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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

    // Parameter minima
    this.paramMin = [0.0];

    // Parameter maxima
    this.paramMax = [1.0];

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

  cdfSingleValue(x, params) {
    if (x < 0) return 0.0;
    if (x === Infinity) return 1.0;

    let theta = params[0];

    return 1.0 - Math.pow(1.0 - theta, x + 1.0);
  }

  ppfSingleValue(p, params) {
    let theta = params[0];

    if (p === 0) return 0;
    if (p === 1) return Infinity;
    if (theta === 1) return 0;

    let res = Math.ceil(Math.log(1 - p) / Math.log(1 - theta) - 1);

    if (res === -0) return 0;
    return res;
  }

  defaultXRange(params) {
    let theta = params[0];

    return [-1, this.ppfSingleValue(0.999, params)];
  }

  quantileSet(x, p) {
    let x1 = x[0];
    let p1 = p[0];

    if (!Number.isInteger(x1)) {
      throw new Error(this.varName + ' must be integer.')
    }
    if (x1 < 0) {
      throw new Error('Must have ' + this.varName + ' > 0.')
    }

    return [[1.0 - Math.pow(1.0 - p1, 1.0 / (x1 + 1.0))], true];
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

    // Parameter minima
    this.paramMin = [0, 0, 0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['N'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    let [N, a, b] = params.slice(0, 3);
    return Math.max(0, N - b);
  }

  xMax(params) {
    let [N, a, b] = params.slice(0, 3);
    return Math.min(N, a);
  }

  pmfSingleValue(n, params) {
    let [N, a, b] = params.slice(0, 3);

    if (n < Math.max(0, N - b) || n > Math.min(N, a)) return NaN;

    return Math.exp(lnchoice(a, n) + lnchoice(b, N - n) - lnchoice(a + b, N));
  }

  ppfSingleValue(p, params) {
    return super.ppfSingleValue(p, params, this.xMin(params), this.xMax(params), this.xMax(params));
  }

  defaultXRange(params) {
    let [N, a, b] = params.slice(0, 3);

    return [Math.max(0, N - b) - 1, Math.min(N, a) + 1];
  }
}


class NegativeBinomialDistribution extends DiscreteUnivariateDistribution {
  constructor(parametrization = 'alpha-beta', fixedParam = undefined) {
    super(parametrization);

    // Name of distribution
    this.name = 'NegativeBinomial';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = 0;
    this.hardMax = Infinity;

    // Parameter names, in order of params
    if (this.parametrization === 'alpha-beta') {
      this.paramNames = ['α', 'β'];
      this.paramMin = [0.0, 0.0];
      this.paramMax = [Infinity, Infinity];
      if (fixedParam === undefined) this.fixedParams = ['α'];
      else this.fixedParams = [fixedParam];
    } else if (this.parametrization === 'mu-phi') {
      this.paramNames = ['μ', 'φ'];
      this.paramMin = [0.0, 0.0];
      this.paramMax = [Infinity, Infinity];
      if (fixedParam === undefined) this.fixedParams = ['φ'];
      else this.fixedParams = [fixedParam];
    } else if (this.parametrization === 'alpha-p') {
      this.paramNames = ['α', 'p'];
      this.paramMin = [0.0, 0.0];
      this.paramMax = [Infinity, 1.0];
      if (fixedParam === undefined) this.fixedParams = ['α'];
      else this.fixedParams = [fixedParam];
    } else if (this.parametrization === 'r-b') {
      this.paramNames = ['r', 'b'];
      this.paramMin = [0.0, 0.0];
      this.paramMax = [Infinity, Infinity];
      if (fixedParam === undefined) this.fixedParams = ['r'];
      else this.fixedParams = [fixedParam];
    } else { // Some other, probably invalid parameters
      this.paramNames = ['unnamedParam1', 'unnamedParam2'];
      this.paramMin = [0.0, 0.0];
      this.paramMax = [Infinity, Infinity];
      if (fixedParam === undefined) this.fixedParams = ['unnamedParam1'];
      else this.fixedParams = [fixedParam];
    }

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds()
  }

  xMin(params) {
    return 0;
  }

  xMax(params) {
    return Infinity;
  }

  convertParams(params, from = this.parametrization, to = 'alpha-beta') {
    if (from === to) return params;
    else if (to === 'alpha-beta') return this.convertParamsToAlphaBeta(params, from);
    else if (from === 'alpha-beta') return this.convertParamsFromAlphaBeta(params, to);
    else return this.convertParamsFromAlphaBeta(this.convertParamsToAlphaBeta(params, from), to);
  }

  convertParamsToAlphaBeta(params, from = this.parametrization) {
    // Convert parameters
    let alpha, beta;

    if (from === 'mu-phi') {
      let [mu, phi] = params.slice(0, 2);
      alpha = phi;
      beta = alpha / mu;
    } else if (from === 'alpha-p') {
      let [a, p] = params.slice(0, 2);
      alpha = a;
      beta = p / (1 - p);
    } else if (from === 'r-b') {
      let [r, b] = params.slice(0, 2);
      alpha = r;
      beta = 1 / b;
    } else if (from === 'alpha-beta') {
      [alpha, beta] = params.slice(0, 2);
    } else {
      throw new Error('Invalid parametrization for converting. Allowed values are alpha-beta, mu-phi, alpha-p, and r-b.');
    }

    return [alpha, beta];
  }

  convertParamsFromAlphaBeta(params, to = this.parametrization) {
    // Convert parameters from alpha-beta.
    let [alpha, beta] = params.slice(0, 2);

    let output;
    if (to === 'mu-phi') {
      let mu = alpha / beta;
      let phi = alpha;
      output = [mu, phi];
    } else if (to === 'alpha-p') {
      let a = alpha;
      let p = beta / (1 + beta);
      output = [a, p];
    } else if (to === 'r-b') {
      let r = alpha;
      let b = 1 / beta;
      output = [r, b];
    } else if (to === 'alpha-beta') {
      output = [alpha, beta];
    } else {
      throw new Error('Invalid parametrization for converting. Allowed values are alpha-beta, mu-phi, alpha-p, and r-b.');
    }

    return output;
  }

  pmfSingleValue(y, params, parametrization = this.parametrization) {
    if (y < 0) return NaN;

    // Grab parameters in alpha-beta form
    let [alpha, beta] = this.convertParamsToAlphaBeta(params, parametrization);

    if (alpha <= 0 || beta <= 0) return NaN;

    return Math.exp(lngamma(y + alpha)
                    - lngamma(alpha)
                    - lnfactorial(y)
                    + alpha * Math.log(beta / (1 + beta))
                    - y * Math.log(1 + beta));
  }

  cdfSingleValue(y, params, parametrization = this.parametrization) {
    let [alpha, beta] = this.convertParamsToAlphaBeta(params, parametrization);

    if (alpha === 0 || beta === Infinity) return 1.0;
    if (alpha === Infinity) return y === Infinity ? 1.0 : 0.0; 

    if (y <= 0) return 0.0;
    if (y === Infinity) return 1.0;

    return regularizedIncompleteBeta(beta / (1 + beta), alpha, y + 1);
  }

  defaultXRange(params, parametrization = this.parametrization) {
    let [x1, x2] = super.ppf([0.001, 0.999], this.convertParamsToAlphaBeta(params, parametrization));

    // If lower bound is within 10% of the range of bounds to zero, make it zero
    if (x1 < (x2 - x1) / 10.0) x1 = -1.0;

    return [x1, x2];
  }

  // Set one or the other parameter
  quantileSet(x, p, extraParams) {
    if (this.fixedParams.length != 1) {
      throw new Error('Must have exactly one fixed parameter.')
    }

    let x1 = x[0];
    let p1 = p[0];
    let otherParam = extraParams[0];

    if (!Number.isInteger(x1)) {
      throw new Error(this.varName + ' must be integer.')
    }
    if (x1 < 0 ) {
      throw new Error('Must have ' + this.varName + ' > 0.')
    }

    const rootFun = (xi, x1, p1) => {
      if (this.fixedParamsInds[0] === 0) {
        return p1 - this.cdfSingleValue(x1, [otherParam, xi / (1 - xi)], this.parametrization);
      } else {
        return p1 - this.cdfSingleValue(x1, [xi / (1 - xi), otherParam], this.parametrization);        
      }
    }

    let xiOpt = brentSolve(rootFun, 0.0, 1.0, [x1, p1]);
    let optimSuccess = xiOpt != null;
    
    return [[xiOpt / (1 - xiOpt)], optimSuccess];
  }

  // Quantile setting for Negative Binomial is tough due to it approaching Poisson for
  // large parameter alpha, meaning that the Negative Binomial really only has one
  // independent parameter in that case. The strategy is then as follows. We first
  // attempt to hit both quantiles. If that fails, we attempt a Poisson quantile setting
  // for the larger of the two quantiles. We check if that will then manage to hit both
  // quantiles. If so, we report that. Otherwise, it usually means that the distribution 
  // is too narrow; can't get any narrower than Poisson. We then report failure.
  // This is not generally used. Better to fix one parameter and set the other to hit
  // a single quantile.
  quantileSetBoth(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    if (!Number.isInteger(x1) || !Number.isInteger(x2)) {
      throw new Error(this.varName + ' must be integer.')
    }
    if (x1 < 0 || x2 < 0) {
      throw new Error('Must have ' + this.varName + ' > 0.')
    }

    // Easiest to fit in mu-phi parametrization
    // Root finding function using log parameters to enforce positivity
    const quantileRootFun = (params, x1, p1, x2, p2) => {
      let mu = Math.exp(params[0]);
      let phi = Math.exp(params[1]);

      let r1 = this.cdfSingleValue(x1, [mu, phi], 'mu-phi') - p1;
      let r2 = this.cdfSingleValue(x2, [mu, phi], 'mu-phi') - p2;

      return [r1, r2];
    };

    // Guess phi = 1, and then mu to give roughly the mean we would want.
    let meanp = (p1 + p2) / 2;
    let muGuess;
    if (Math.abs(meanp - 0.5) < 0.2) {
      let meanx = (x1 + x2) / 2;
      muGuess = meanx;
    }
    else {
      muGuess = 1.0;
    }

    let args = [x1, p1, x2, p2];
    let guess = [Math.log(muGuess), 1.0];
    let [logParams, optimSuccess] = findRootTrustRegion(quantileRootFun, guess, args=args);

    let paramsOpt;
    if (optimSuccess) {
      let muOpt = Math.exp(logParams[0]);
      let phiOpt = Math.exp(logParams[1]);

      // Attempt to drive phi down as far as possible.
      if (phiOpt > 1) {

        // Function to compute mu for a given value of phi attempting to hit upper quantile      
        const muGivenPhi = (phi, x, p) => {
          dist = new NegativeBinomialDistribution('mu-phi');

          // Function to find mu that hits quantile, with mu transformed to lie between 0 and 1
          const rootFun = (xi, phi, x, p) => { 
            if (xi === 1) return p;
            if (xi === 0) return p - 1;
            return p - this.cdfSingleValue(x, [xi / (1 - xi), phi], 'mu-phi');
          }

          let xiOpt = brentSolve(rootFun, 0.0, 1.0, [phi, x, p]);
          let optimSuccess = xiOpt != null;
          
          return [xiOpt / (1 - xiOpt), optimSuccess];
        }

        // Function to choose a phi, compute mu to hit upper quantile, and then check that both lower
        // and upper quantile were hit.
        const hitQuantiles = (phi, x1, p1, x2, p2) => {
          let [muAdj, rootFindSuccess] = muGivenPhi(phi, x2, p2);

          if (rootFindSuccess) {
            let [q1, q2] = this.ppf([p1, p2], [muAdj, phi], 'mu-phi');

            if (q1 === x1 && q2 === x2) return 1;
            else return -1;
          } else {
            return -1;
          }
        } 

        if (hitQuantiles(1.0) === 1) {
          phiOpt = 1.0;
          let [muAdj, rootFindSuccess] = muGivenPhi(phiOpt, x2, p2);
          muOpt = muAdj;
        }
        else {
          let phiAdj = bisectionSolve(hitQuantiles, 1.0, phiOpt, [x1, p1, x2, p2]);
          if (phiAdj != null) {
            phiOpt = phiAdj;
            let [muAdj, rootFindSuccess] = muGivenPhi(phiOpt, x2, p2);
            muOpt = muAdj;
          }
        }
      }

      paramsOpt = this.convertParams([muOpt, phiOpt], 'mu-phi', this.parametrization);
    } else { // Try Poisson with upper
      let pois = new PoissonDistribution();
      let [paramsPois, optimSuccessPois] = pois.quantileSet([x2], [p2]);

      if (optimSuccessPois) {
        let poisQuants = pois.ppf([p1, p2], paramsPois);
        if (poisQuants[0] === x1 && poisQuants[1] === x2) {
          let errText;
          if (this.parametrization == 'alpha-beta'|| this.parametrization == 'alpha-p') {
            errText = 'Use Poisson (α → ∞ limit) with λ = ' + paramsPois[0].toPrecision(4);
          }
          else if (this.parametrization == 'mu-phi') {
            errText = 'Use Poisson (φ → ∞ limit) with λ = ' + paramsPois[0].toPrecision(4);
          }
          else if (this.parametrization == 'r-b') {
            errText = 'Use Poisson (r → ∞ limit) with λ = ' + paramsPois[0].toPrecision(4);
          }
          throw new Error(errText);
        }
        // Otherwise, failed with Poisson.
      }
      paramsOpt = [];
    }

    return [paramsOpt, optimSuccess];
  }
}


class NegativeBinomialMuPhiDistribution extends NegativeBinomialDistribution {
  constructor() {
    super('mu-phi');
  }
}


class NegativeBinomialAlphaPDistribution extends NegativeBinomialDistribution {
  constructor() {
    super('alpha-p');
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

    // Parameter minima
    this.paramMin = [0.0];

    // Parameter maxima
    this.paramMax = [Infinity];

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

  cdfSingleValue(n, params) {
    if (n < 0) return 0.0;
    if (n === Infinity) return 1.0;

    let lam = params[0];

    if (lam === 0) return 1.0;

    return gammaincU(lam, n + 1, true);
  }

  defaultXRange(params) {
    return super.ppf([0.001, 0.999], params)
  }

  quantileSet(x, p) {
    let x1 = x[0];
    let p1 = p[0];

    if (!Number.isInteger(x1)) {
      throw new Error(this.varName + ' must be integer.')
    }
    if (x1 < 0) {
      throw new Error('Must have ' + this.varName + ' ≥ 0.')
    }

    // Know it exactly for p1 = 1 and x1 = 0, lambda has to be zero.
    if (x1 === 0 && p1 === 1) return [[0.0], true];

    // Root finding function for quantile using transformation to maintain positivity
    const rootFun = (xi) => {
      if (xi === 1) return p1;
      return p1 - this.cdfSingleValue(x1, [xi / (1 - xi)]);
    }

    let xiOpt = brentSolve(rootFun, 0.0, 1.0);
    let optimSuccess = xiOpt != null;
    
    return [[xiOpt / (1 - xiOpt)], optimSuccess];
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

    // Parameter minima
    this.paramMin = [0.0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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

    // Parameter minima
    this.paramMin = [0.0];

    // Parameter maxima
    this.paramMax = [Infinity];

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

    let betaOptim;
    if (x1 == 0 || p1 == 1) {
      betaOptim = Infinity;
    }
    else {
      betaOptim = -Math.log(1.0 - p1) / x1
    }

    return [[betaOptim], true];
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

    // Parameter minima
    this.paramMin = [0.0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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
    this.paramNames = ['μ', 'σ'];

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['μ'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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
    this.paramNames = ['μ', 'σ'];

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['μ'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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
    this.paramNames = ['ν', 'μ', 'σ'];

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['ν', 'μ'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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
    // Adjust default range depending on weight of tail
    let [nu, mu, sigma] = params.slice(0, 3);
    let p2;

    if (nu < 2) p2 = 0.95;
    else if (nu < 4) p2 = 0.99;
    else if (nu < 10) p2 = 0.995;
    else p2 = 0.999;

    return [params[1], this.ppf(p2, params)];
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

    // Parameter minima
    this.paramMin = [0.0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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

    // Parameter minima
    this.paramMin = [0.0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [0.0, -Infinity, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = ['ν'];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
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

    // Parameter minima
    this.paramMin = [-Infinity, -Infinity];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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

class VonMisesDistribution extends ContinuousUnivariateDistribution {
  // Only add parametrization argument to constructor() and super() in the next two lines
  // if you need to define it (i.e., more than one possibility)
  constructor() {
    super();

    // Name of distribution
    this.name = 'Von Mises';

    // Name of independent variable (used in quantile setter)
    this.varName = 'y';

    // Maximum allowed min and max of the distribution, regardless of params
    this.hardMin = -Math.PI;
    this.hardMax = Math.PI;

    // Parameter names, in order of params
    this.paramNames = ['μ', 'κ'];

    // Location parameter
    this.locationParam = 'μ';

    // Parameter minima
    this.paramMin = [-Math.PI, 0.0];

    // Parameter maxima
    this.paramMax = [Math.PI, Infinity];

    // Parameters that are fixed in quantile setting
    this.fixedParams = [];

    // Trigger computing active and fixed indices for quantile setting
    super.generateActiveFixedInds();

    // Trigger computing location parameter index
    super.generateLocationParamIndex();
  }

  xMin(params) {
    return this.hardMin;
  }

  xMax(params) {
    return this.hardMax;
  }

  pdfSingleValue(x, params) {
    let [mu, kappa] = params.slice(0, 2);

    return Math.exp(kappa * cosm1(x - mu)) / (2 * Math.PI * besseli0(kappa, true));
  }

  cdfSingleValueNormalApprox(x, params) {
    // CDF approximating the distribution as Normal (sum three Normals together to handle periodicity)
    let [mu, kappa] = params.slice(0, 2);
    let sigma = 1.0 / Math.sqrt(kappa);
    let twopi = 2.0 * Math.PI;

    let normal = new NormalDistribution();
    let result = normal.cdfSingleValue(x, [mu - twopi, sigma]);
    result -= normal.cdfSingleValue(-Math.PI, [mu - twopi, sigma]);
    result += normal.cdfSingleValue(x, [mu, sigma]);
    result -= normal.cdfSingleValue(-Math.PI, [mu, sigma]);
    result += normal.cdfSingleValue(x, [mu + twopi, sigma]);
    result -= normal.cdfSingleValue(-Math.PI, [mu + twopi, sigma]);

    return result
  }

  cdfSingleValue(x, params) {
    let [mu, kappa] = params.slice(0, 2);
    let result;

    if (isclose(x, this.hardMin)) result = 0;
    else if (isclose(x, this.hardMax)) result = 1;
    else if (kappa > 50) {
      result = this.cdfSingleValueNormalApprox(x, params);
    } else {
      // Just do numerical quadrature to get CDF.
      let nChebPoints = 100;

      let f = (x) => this.pdfSingleValue(x, params);
      result = clenshawCurtisIntegrate(f, this.hardMin, x, nChebPoints);
    }

    return result;
  }

  // This function works for when mu = 0, but not otherwise.
  cdfSingleValueForMu0(x, params) {
    let [mu, kappa] = params.slice(0, 2);

    if (!isclose(mu, 0)) {
      throw new Error("cdfSingleValueFor Mu0 only works for μ = 0.")
    }

    let vonMisesSeries = (k, y, p) => {
      let s = Math.sin(y);
      let c = Math.cos(y);
      let sn = Math.sin(p * y);
      let cn = Math.cos(p * y);
      let R = 0;
      let V = 0;

      for (let n = p - 1; n > 0; n--) {
        [sn, cn] = [sn * c - cn * s, cn * c + sn * s];
        R = 1.0 / (2 * n / k + R);
        V = R * (sn / n + V);
      }

      return 0.5 + y / (2 * Math.PI) + V / Math.PI;
    } 

    let vonMisesNormalApprox = (k, y) => {
      let b = Math.sqrt(2 * Math.PI) / besseli0(k, true);
      let z = b * Math.sin(y / 2.0)

      return (1 + erf(z / Math.sqrt(2))) / 2;
    }

    // Uncenter
    let y = x - mu;

    // Convert input to list between 0 and 2π.
    let iy = Math.round(y / (2.0 * Math.PI))
    y -= iy * (2 * Math.PI)

    // Constants
    let CK = 50;
    let [a1, a2, a3, a4] = [28.0, 0.5, 100.0, 5.0];

    // Case there Normal approximation works
    let result;
    if (kappa >= CK) result = vonMisesNormalApprox(kappa, y);
    else {
    let p = Math.floor(1 + a1 + a2 * kappa - a3 / (kappa + a4));
        result = vonMisesSeries(kappa, y, p)
        result = result < 0 ? 0 : result > 1 ? 1 : result;
    }

    return result;
  }

  ppfSingleValue(p, params) {
    if (p == 0) return 0.0;
    if (p == 1) return 2.0 * Math.PI;

    // Root finding function for ppf
    let rootFun = (x, params, p) => p - this.cdfSingleValue(x, params);
    
    let result = brentSolve(rootFun, this.hardMin, this.hardMax, [params, p]);

    if (result === null) return 0.0;
    else return result;
  }

  defaultXRange(params) {
    return [this.hardMin, this.hardMax];
  }

  quantileSet(x, p) {
    let [x1, x2] = x.slice(0, 2);
    let [p1, p2] = p.slice(0, 2);

    if (x1 <= -Math.PI || x1 >= Math.PI || x2 <= -Math.PI || x2 >= Math.PI) {
      throw new Error("lower and upper " + this.varName + " must be in interval (-π and π).")
    }

    // Root finding function using log of scale parameter to enforce positivity
    const quantileRootFun = (params, x1, p1, x2, p2) => {
      // params[0] can go from -inf to inf,with mu going from -pi to pi
      let mu = Math.PI * (2 / (1 + Math.exp(-params[0])) - 1);
      let kappa = Math.exp(params[1]);

      let r1 = this.cdfSingleValue(x1, [mu, kappa]) - p1;
      let r2 = this.cdfSingleValue(x2, [mu, kappa]) - p2;

      return [r1, r2];
    };

    // Obtain a guess based on Normal approximation
    let normal = new NormalDistribution();
    let [paramsOpt, optimSuccess] = normal.quantileSet(x, p);
    let [muGuess, sigmaGuess] = paramsOpt;
    let guess;
    if (optimSuccess && muGuess > -Math.PI && muGuess < Math.PI) {
      guess = [Math.log((Math.PI + muGuess) / (Math.PI - muGuess)), -2 * Math.log(sigmaGuess)];
    }
    else {
      guess = [0.0, 0.0];
    }

    // Now solve from guess
    let args = [x1, p1, x2, p2];
    [paramsOpt, optimSuccess] = findRootTrustRegion(
      quantileRootFun, 
      guess, 
      args, 
      jacCentralDiff,
      0.00001,  /* Have to relax the tolerance because of Clenshaw_Curtis error */
      1000      /* Take fewer steps */
    );
    paramsOpt = [Math.PI * (2 / (1 + Math.exp(-paramsOpt[0])) - 1), Math.exp(paramsOpt[1])];

    return [paramsOpt, optimSuccess];
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

    // Parameter minima
    this.paramMin = [0.0, 0.0];

    // Parameter maxima
    this.paramMax = [Infinity, Infinity];

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
  VonMisesDistribution,
  WeibullDistribution,
}



