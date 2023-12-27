// const { Matrix, CholeskyDecomposition } = require('../legacy/matrix.js');

const { jacCentralDiff, findRootTrustRegion, computeRho, checkTol, doglegStep,secantSolve,newtonSolve,brentSolve } = require('./root_finding.js');

const { isclose, isone, iszero, linspace, logspace, meshgrid, arange, logit, log1p, erf, erfinv, lnchoice, lnbeta, betacf, regularizedIncompleteBeta, incompleteBeta, lngamma, gammaincU, gammaincL, lnfactorial } = require('./utils_math.js');

const { transpose, mvMult, svMult, smMult, svAdd, mmMult, vectorAdd, elementwiseVectorDivide, elementwiseVectorMult, svMultAdd, absVector, dot, norm, quadForm, shallowCopyMatrix, deepCopy, zeros, lowerTriSolve, upperTriSolve, modifiedCholesky, modifiedCholeskySolve, solvePosDef, LUPDecompose, LUPSolve, solve } = require('./utils_linalg.js');

const { UnivariateDistribution,  DiscreteUnivariateDistribution, ContinuousUnivariateDistribution, BernoulliDistribution, BetaBinomialDistribution, BinomialDistribution, CategoricalDistribution, DiscreteUniformDistribution, GeometricDistribution, HypergeometricDistribution, NegativeBinomialDistribution, PoissonDistribution, BetaDistribution, CauchyDistribution, ExponentialDistribution, GammaDistribution, HalfCauchyDistribution, HalfNormalDistribution, HalfStudentTDistribution, InverseGammaDistribution, LogNormalDistribution, NormalDistribution, ParetoDistribution, StudentTDistribution, UniformDistribution, WeibullDistribution } = require('./prob_dists.js');
