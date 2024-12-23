import warnings

import numpy as np
import scipy.special
import scipy.stats as st

import bokeh.events
import bokeh.layouts
import bokeh.models
import bokeh.plotting

from . import callbacks

discrete_dists = [
    "bernoulli",
    "binomial",
    "categorical",
    "discrete_uniform",
    "geometric",
    "hypergeometric",
    "negative_binomial",
    "negative_binomial_mu_phi",
    "negative_binomial_r_b",
    "poisson",
    "telegraph_rna",
]

continuous_dists = [
    # Commented out dists are allowed alternative names
    "beta",
    "beta_phi_kappa",
    "cauchy",
    "exponential",
    "gamma",
    # "halfcauchy",  # Same as half_cauchy
    "half_cauchy",
    # "halfnormal",   # Same as half_normal
    "half_normal",
    # "halfstudent_t",    # Same as half_student_t
    "half_student_t",
    "invgamma",                # Same as inverse_gamma
    "inverse_gamma",
    "invgamma",  # Same as inverse_gamma
    "inverse_gaussian",
    # "invgauss",    # Same as inverse_gaussian
    # "invgaussian", # Same a inverse_gaussian
    "lognormal",
    "log_normal",  # Same as lognormal
    "normal",
    "gaussian",  # Same as normal
    "pareto",
    "student_t",
    "vonmises",  # Same as von_mises
    "von_mises",
    "uniform",
    # "wald",  # Same as inverse_gaussian
    "weibull",
]


def _to_camel_case(input_str):
    result = "".join(word.capitalize() for word in input_str.split("_"))

    # If we have acronyms in the name, re-capitalize
    if 'Dna' in result:
        result = result.replace('Dna', 'DNA')
    if 'Rna' in result:
        result = result.replace('Rna', 'RNA')

    return result


def _categorical_pmf(x, theta_1, theta_2, theta_3):
    thetas = np.array([theta_1, theta_2, theta_3, 1 - theta_1 - theta_2 - theta_3])
    if np.any(thetas < 0):
        return np.nan

    out = np.empty_like(x, dtype=float)
    inds = np.logical_and(x >= 1, x <= 4)
    out[inds] = thetas[x[inds] - 1]
    out[~inds] = np.nan

    return out


def _categorical_cdf_indiv(x, thetas):
    if x < 1:
        return 0
    elif x >= 4:
        return 1
    else:
        return np.sum(thetas[: int(x)])


def _categorical_cdf(x, theta_1, theta_2, theta_3):
    thetas = np.array([theta_1, theta_2, theta_3, 1 - theta_1 - theta_2 - theta_3])
    if (thetas < 0).any():
        return np.array([np.nan] * len(x))

    return np.array([_categorical_cdf_indiv(x_val, thetas) for x_val in x])


def _discrete_cdf_indiv(x, pmf, x_min, params):
    cumsum = 0.0
    summand = 0.0
    for n in range(int(x_min), int(x) + 1):
        summand = pmf(n, *params)
        if not np.isnan(summand):
            cumsum += summand

    return cumsum


def _discrete_cdf(x, pmf, x_min, params):
    if np.isscalar(x):
        return _discrete_cdf_indiv(x, pmf, x_min, params)
    else:
        return np.array([_discrete_cdf_indiv(x_val, pmf, x_min, params) for x_val in x])


def _halfstudent_t_pdf(x, nu, mu, sigma):
    out = np.empty_like(x)
    out[x >= mu] = 2 * st.t.pdf(x[x >= mu], nu, mu, sigma)
    out[x < mu] = 0.0
    return out


def _halfstudent_t_cdf(x, nu, mu, sigma):
    out = np.empty_like(x)
    out[x >= mu] = 2 * st.t.cdf(x[x >= mu], nu, mu, sigma) - 1
    out[x < mu] = 0.0
    return out


def _log_pochhammer(a, n):
    return scipy.special.gammaln(a + n) - scipy.special.gammaln(a)


def _telegraph_rna_pmf_indiv(kon, koff, beta, n):
    log_res = n * np.log(beta)
    log_res -= scipy.special.loggamma(n + 1)

    # Pochhammers
    log_res += _log_pochhammer(kon, n) - _log_pochhammer(kon + koff, n)

    # Hypergeometric
    log_res += np.log(scipy.special.hyp1f1(kon + n, kon + koff + n, -beta))

    return np.exp(log_res)

def _telegraph_rna_pmf(x, kon, koff, beta):
    if np.isscalar(x):
        return _telegraph_rna_pmf_indiv(kon, koff, beta, x)
    else:
        return np.array([_telegraph_rna_pmf_indiv(kon, koff, beta, n) for n in x])


def _telegraph_rna_cdf(x, kon, koff, beta):
    _discrete_cdf(x, _telegraph_rna_pmf, 0, (kon, koff, beta))


def _funs(dist):
    if dist == "bernoulli":
        return st.bernoulli.pmf, st.bernoulli.cdf
    elif dist == "binomial":
        return st.binom.pmf, st.binom.cdf
    elif dist == "categorical":
        return _categorical_pmf, _categorical_cdf
    elif dist == "discrete_uniform":
        return (
            lambda x, low, high: st.randint.pmf(x, low, high + 1),
            lambda x, low, high: st.randint.cdf(x, low, high + 1),
        )
    elif dist == "geometric":
        return (
            lambda x, theta: st.geom.pmf(x, theta, -1),
            lambda x, theta: st.geom.cdf(x, theta, -1),
        )
    elif dist == "hypergeometric":
        return (
            lambda x, N, a, b: st.hypergeom.pmf(x, a + b, a, N),
            lambda x, N, a, b: st.hypergeom.cdf(x, a + b, a, N),
        )
    elif dist == "negative_binomial":
        return (
            lambda x, alpha, beta: st.nbinom.pmf(x, alpha, beta / (1 + beta)),
            lambda x, alpha, beta: st.nbinom.cdf(x, alpha, beta / (1 + beta)),
        )
    elif dist == "negative_binomial_mu_phi":
        return (
            lambda x, mu, phi: st.nbinom.pmf(x, phi, phi / mu),
            lambda x, mu, phi: st.nbinom.cdf(x, phi, phi / mu),
        )
    elif dist == "negative_binomial_r_b":
        return (
            lambda x, r, b: st.nbinom.pmf(x, r, 1 / (1 + b)),
            lambda x, r, b: st.nbinom.cdf(x, r, 1 / (1 + b)),
        )
    elif dist == "poisson":
        return st.poisson.pmf, st.poisson.cdf
    elif dist == "telegraph_rna":
        return _telegraph_rna_pmf, _telegraph_rna_cdf
    elif dist == "beta":
        return st.beta.pdf, st.beta.cdf
    elif dist == "beta_phi_kappa":
        return (
            lambda x, phi, kappa: st.beta.pdf(x, phi * kappa, (1 - phi) * kappa),
            lambda x, phi, kappa: st.beta.cdf(x, phi * kappa, (1 - phi) * kappa),
        )
    elif dist == "cauchy":
        return st.cauchy.pdf, st.cauchy.cdf
    elif dist == "exponential":
        return (
            lambda x, beta: st.expon.pdf(x, loc=0, scale=1 / beta),
            lambda x, beta: st.expon.cdf(x, loc=0, scale=1 / beta),
        )
    elif dist == "gamma":
        return (
            lambda x, alpha, beta: st.gamma.pdf(x, alpha, loc=0, scale=1 / beta),
            lambda x, alpha, beta: st.gamma.cdf(x, alpha, loc=0, scale=1 / beta),
        )
    elif dist == "half_cauchy":
        return st.halfcauchy.pdf, st.halfcauchy.cdf
    elif dist == "half_normal":
        return st.halfnorm.pdf, st.halfnorm.cdf
    elif dist == "half_student_t":
        return _halfstudent_t_pdf, _halfstudent_t_cdf
    elif dist == "inverse_gamma":
        return (
            lambda x, alpha, beta: st.invgamma.pdf(x, alpha, loc=0, scale=beta),
            lambda x, alpha, beta: st.invgamma.cdf(x, alpha, loc=0, scale=beta),
        )
    elif dist == "inverse_gaussian":
        return (
            lambda x, mu, lam: st.invgauss.pdf(x, mu / lam, loc=0, scale=lam),
            lambda x, mu, lam: st.invgauss.cdf(x, mu / lam, loc=0, scale=lam),
        )
    elif dist == "log_normal":
        return (
            lambda x, mu, sigma: st.lognorm.pdf(x, sigma, loc=0, scale=np.exp(mu)),
            lambda x, mu, sigma: st.lognorm.cdf(x, sigma, loc=0, scale=np.exp(mu)),
        )
    elif dist == "normal":
        return st.norm.pdf, st.norm.cdf
    elif dist == "pareto":
        return (
            lambda x, y_min, alpha: st.pareto.pdf(x, alpha, scale=y_min),
            lambda x, y_min, alpha: st.pareto.cdf(x, alpha, scale=y_min),
        )
    elif dist == "student_t":
        return st.t.pdf, st.t.cdf
    elif dist == "uniform":
        return (
            lambda x, alpha, beta: st.uniform.pdf(x, alpha, beta - alpha),
            lambda x, alpha, beta: st.uniform.cdf(x, alpha, beta - alpha),
        )
    elif dist == "von_mises":
        return (
            lambda x, mu, kappa: st.vonmises_line.pdf(x, kappa, loc=mu),
            lambda x, mu, kappa: st.vonmises_line.cdf(x, kappa, loc=mu),
        )
    elif dist == "weibull":
        return (
            lambda x, alpha, sigma: st.weibull_min.pdf(x, alpha, loc=0, scale=sigma),
            lambda x, alpha, sigma: st.weibull_min.cdf(x, alpha, loc=0, scale=sigma),
        )
    else:
        raise RuntimeError("Distribution not included.")


def _load_params(dist, _params, _x_min, _x_max, _x_axis_label, _title):
    # DEBUG: This is a holder until all dists have quantile setter params
    quantile_setter_params = {}

    if dist == "bernoulli":
        params = [
            dict(
                name="θ",
                start=0,
                end=1,
                value=0.5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value=1,
            )
        ]
        x_min = -0.2
        x_max = 1.2
        x_axis_label = "y"
        title = "Bernoulli"
    elif dist == "binomial":
        params = [
            dict(
                name="N",
                start=1,
                end=20,
                value=20,
                step=1,
                is_int=True,
                min_value=1,
                max_value="Infinity",
            ),
            dict(
                name="θ",
                start=0,
                end=1,
                value=0.5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value=1,
            ),
        ]
        x_min = -0.5
        x_max = 20.5
        x_axis_label = "n"
        title = "Binomial"
    elif dist == "categorical":
        params = [
            dict(
                name="θ₁",
                start=0,
                end=1,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value=1,
            ),
            dict(
                name="θ₂",
                start=0,
                end=1,
                value=0.3,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value=1,
            ),
            dict(
                name="θ₃",
                start=0,
                end=1,
                value=0.1,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value=1,
            ),
        ]
        x_min = 0.75
        x_max = 4.25
        x_axis_label = "category"
        title = "Categorical"
    elif dist == "discrete_uniform":
        params = [
            dict(
                name="low",
                start=0,
                end=10,
                value=0,
                step=1,
                is_int=True,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="high",
                start=0,
                end=10,
                value=10,
                step=1,
                is_int=True,
                min_value="-Infinity",
                max_value="Infinity",
            ),
        ]
        x_min = -0.5
        x_max = 10.5
        x_axis_label = "n"
        title = "Discrete Uniform"
    elif dist == "geometric":
        params = [
            dict(
                name="θ",
                start=0,
                end=1,
                value=0.5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value=1,
            )
        ]
        x_min = -0.5
        x_max = 20
        x_axis_label = "y"
        title = "Geometric"
    elif dist == "hypergeometric":
        params = [
            dict(
                name="N",
                start=1,
                end=20,
                value=5,
                step=1,
                is_int=True,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="a",
                start=1,
                end=20,
                value=10,
                step=1,
                is_int=True,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="b",
                start=1,
                end=20,
                value=10,
                step=1,
                is_int=True,
                min_value=0,
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 20
        x_axis_label = "n"
        title = "Hypergeometric"
    elif dist == "negative_binomial":
        params = [
            dict(
                name="α",
                start=0.01,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="β",
                start=0.01,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 50
        x_axis_label = "y"
        title = "Negative Binomial"
    elif dist == "negative_binomial_mu_phi":
        params = [
            dict(
                name="µ",
                start=0.01,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="φ",
                start=0.01,
                end=5,
                value=1,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 50
        x_axis_label = "y"
        title = "Negative Binomial"
    elif dist == "negative_binomial_r_b":
        params = [
            dict(
                name="r",
                start=0.01,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="b",
                start=0.01,
                end=5,
                value=1,
                step=0.01,
                is_int=False,
                min_value=0.01,
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 50
        x_axis_label = "y"
        title = "Negative Binomial"
    elif dist == "poisson":
        params = [
            dict(
                name="λ",
                start=0.01,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            )
        ]
        x_min = 0
        x_max = 40
        x_axis_label = "n"
        title = "Poisson"
    elif dist == "telegraph_rna":
        params = [
            dict(
                name="kon",
                start=0.01,
                end=10,
                value=1,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="koff",
                start=0.01,
                end=10,
                value=1,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="beta",
                start=0.01,
                end=10,
                value=1,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 50
        x_axis_label = "n"
        title = "Telegraph RNA"
    elif dist == "beta":
        params = [
            dict(
                name="α",
                start=0.01,
                end=10,
                value=1,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="β",
                start=0.01,
                end=10,
                value=1,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 1
        x_axis_label = "θ"
        title = "Beta"
    elif dist == "beta_phi_kappa":
        params = [
            dict(
                name="φ",
                start=0.001,
                end=0.999,
                value=0.5,
                step=0.001,
                is_int=False,
                min_value="0",
                max_value="1",
            ),
            dict(
                name="κ",
                start=0.01,
                end=10,
                value=2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 1
        x_axis_label = "θ"
        title = "Beta"
    elif dist == "cauchy":
        params = [
            dict(
                name="µ",
                start=-0.5,
                end=0.5,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0.1,
                end=1.0,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = -2
        x_max = 2
        x_axis_label = "y"
        title = "Cauchy"
    elif dist == "exponential":
        params = [
            dict(
                name="β",
                start=0.1,
                end=1,
                value=0.25,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            )
        ]
        x_min = 0
        x_max = 30
        x_axis_label = "y"
        title = "Exponential"
    elif dist == "gamma":
        params = [
            dict(
                name="α",
                start=1,
                end=5,
                value=2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="β",
                start=0.1,
                end=5,
                value=2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 10
        x_axis_label = "y"
        title = "Gamma"
    elif dist == "half-cauchy" or dist == "halfcauchy" or dist == "half_cauchy":
        params = [
            dict(
                name="µ",
                start=0,
                end=1.0,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0,
                end=1,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 4
        x_axis_label = "y"
        title = "Half-Cauchy"
    elif dist == "half-normal" or dist == "halfnormal" or dist == "half_normal":
        params = [
            dict(
                name="µ",
                start=0,
                end=1.0,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0,
                end=1,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 4
        x_axis_label = "y"
        title = "Half-Normal"
    elif dist == "halfstudent_t" or dist == "half_student_t":
        params = [
            dict(
                name="ν",
                start=1,
                end=10,
                value=2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="μ",
                start=0.0,
                end=1.0,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0.1,
                end=1.0,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 2
        x_axis_label = "y"
        title = "Half-Student-t"
    elif dist == "inverse_gamma" or dist == "invgamma":
        params = [
            dict(
                name="α",
                start=0.01,
                end=2,
                value=0.5,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="β",
                start=0.1,
                end=2,
                value=1,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 20
        x_axis_label = "y"
        title = "Inverse Gamma"
    elif dist == "inverse_gaussian" or dist == "invgaussian" or dist == "invgauss" or dist == "wald":
        params = [
            dict(
                name="µ",
                start=0.1,
                end=20,
                value=10,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="λ",
                start=0.1,
                end=20,
                value=10,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 50
        x_axis_label = "y"
        title = "Inverse Gaussian"
    elif dist == "lognormal" or dist == "log_normal":
        params = [
            dict(
                name="µ",
                start=-0.5,
                end=0.5,
                value=0.0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0.1,
                end=1.0,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 4
        x_axis_label = "y"
        title = "Log-Normal"
    elif dist == "normal" or dist == "gaussian":
        params = [
            dict(
                name="µ",
                start=-0.5,
                end=0.5,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0,
                end=1,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = -2
        x_max = 2
        x_axis_label = "y"
        title = "Normal"
    elif dist == "pareto":
        params = [
            dict(
                name="ymin",
                start=0.1,
                end=1.0,
                value=0.1,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="α",
                start=0.01,
                end=4,
                value=2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 10
        x_axis_label = "y"
        title = "Pareto"
    elif dist == "student_t":
        params = [
            dict(
                name="ν",
                start=1,
                end=10,
                value=2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="μ",
                start=-0.5,
                end=0.5,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0.1,
                end=1.0,
                value=0.2,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = -2
        x_max = 2
        x_axis_label = "y"
        title = "Student-t"
    elif dist == "uniform":
        params = [
            dict(
                name="α",
                start=0,
                end=10,
                value=0,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
            dict(
                name="β",
                start=0,
                end=10,
                value=10,
                step=0.01,
                is_int=False,
                min_value="-Infinity",
                max_value="Infinity",
            ),
        ]
        x_min = -1
        x_max = 11
        x_axis_label = "y"
        title = "Uniform"
    elif dist == "von_mises":
        params = [
            dict(
                name="μ",
                start=-3.1416,  # Need to be just a few decimal places for
                end=3.1416,  # slider start/end adjust windows
                value=0,
                step=0.01,
                is_int=False,
                min_value="-3.1416",
                max_value="3.1416",
            ),
            dict(
                name="κ",
                start=0.01,
                end=10,
                value=1,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = -np.pi
        x_max = np.pi
        x_axis_label = "y"
        title = "Von Mises"
    elif dist == "weibull":
        params = [
            dict(
                name="α",
                start=0.1,
                end=5,
                value=1,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
            dict(
                name="σ",
                start=0.1,
                end=3,
                value=1.5,
                step=0.01,
                is_int=False,
                min_value="0",
                max_value="Infinity",
            ),
        ]
        x_min = 0
        x_max = 8
        x_axis_label = "y"
        title = "Weibull"
    params = params if _params is None else _params
    x_min = x_min if _x_min is None else _x_min
    x_max = x_max if _x_max is None else _x_max
    x_axis_label = x_axis_label if _x_axis_label is None else _x_axis_label
    title = title if _title is None else _title

    return params, x_min, x_max, x_axis_label, title


def _compute_quantile_setter_params(dist, params, ptiles=None):
    """Compute quantile setter params for a given distribution with a
    params list of dicts.

    Parameters
    ----------
    dist : str
        Name of distribution
    params : list of dicts
        A list of parameter specifications. Each entry in the list gives
        specifications for a parameter of the distribution stored as a
        dictionary. Each dictionary must have the following keys.
            name : str, name of the parameter
            start : float, starting point of slider for parameter (the
                smallest allowed value of the parameter)
            end : float, ending point of slider for parameter (the
                largest allowed value of the parameter)
            value : float, the value of the parameter that the slider
                takes initially. Must be between start and end.
            step : float, the step size for the slider
    ptiles : list of floats between 0 and 1
        Percentiles for quantile setter. If none, default values for
        each distribution are used accounting for 95% range.

    Returns
    -------
    x : list
        List of x-values to populate quantile setter boxes
    p : list
        List of p-values to populate quantile setter boxes
    """
    # Default: No quantile setter
    x = []
    p = []

    # For some reason, Bernoulli isn't working with quantile setting;
    # PMF vanishes when quantile setting invoked. It's trivial anyway,
    # so ok to omit.
    # if dist == "bernoulli":
    #     p = [0.5] if ptiles is None else list(ptiles)
    #     x = [0]
    if dist == "binomial":
        p = [0.5] if ptiles is None else list(ptiles)
        x = list(st.binom.ppf(p, params[0]["value"], params[1]["value"]))
    if dist == "geometric":
        p = [0.5] if ptiles is None else list(ptiles)
        x = list(st.gamma.ppf(p, params[0]["value"], loc=-1))
    if dist == "geometric":
        p = [0.5] if ptiles is None else list(ptiles)
        x = [0]
    if dist == "negative_binomial":
        p = [0.5] if ptiles is None else list(ptiles)
        x = list(
            st.nbinom.ppf(
                p, params[0]["value"], params[1]["value"] / (1 + params[1]["value"])
            )
        )
    if dist == "negative_binomial_mu_phi":
        p = [0.5] if ptiles is None else list(ptiles)
        x = list(
            st.nbinom.ppf(
                p,
                params[0]["value"],
                params[1]["value"] / (params[0]["value"] + params[1]["value"]),
            )
        )
    if dist == "negative_binomial_r_b":
        p = [0.5] if ptiles is None else list(ptiles)
        x = list(st.nbinom.ppf(p, params[0]["value"], 1 / (1 + params[1]["value"])))
    if dist == "poisson":
        p = [0.5] if ptiles is None else list(ptiles)
        x = list(st.poisson.ppf(p, params[0]["value"]))
    if dist == "telegraph_rna":
        p = [0.5] if ptiles is None else list(ptiles)
        x = 0
        cumsum = 0
        while cumsum < p[0]:
            cumsum += _telegraph_rna_pmf(x, params[0]["value"], params[1]["value"], params[2]["value"])
            x += 1
        x = [x]
    if dist == "beta":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(st.beta.ppf(p, params[0]["value"], params[1]["value"]))
    if dist == "beta_phi_kappa":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.beta.ppf(
                p,
                params[0]["value"] * params[1]["value"],
                (1 - params[0]["value"]) * params[1]["value"],
            )
        )
    if dist == "cauchy":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(st.cauchy.ppf(p, params[0]["value"], params[1]["value"]))
    if dist == "exponential":
        p = [0.95] if ptiles is None else list(ptiles)
        x = [-np.log(1.0 - p[0]) / params[0]["value"]]
    if dist == "gamma":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.gamma.ppf(p, params[0]["value"], loc=0, scale=1.0 / params[1]["value"])
        )
    if dist == "half_cauchy":
        p = [0.95] if ptiles is None else list(ptiles)
        x = list(st.halfcauchy.ppf(p, params[0]["value"], params[1]["value"]))
    if dist == "half_normal":
        p = [0.95] if ptiles is None else list(ptiles)
        x = list(st.halfnorm.ppf(p, params[0]["value"], params[1]["value"]))
    if dist == "half_student_t":
        p = [0.95] if ptiles is None else list(ptiles)
        x = list(
            st.t.ppf(
                [(1 + p_val) / 2 for p_val in p], params[0]["value"], params[1]["value"]
            )
        )
    if dist == "inverse_gamma":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.invgamma.ppf(p, params[0]["value"], loc=0, scale=params[1]["value"])
        )
    if dist == "inverse_gaussian":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.invgauss.ppf(p, params[0]["value"] / params[1]['value'], loc=0, scale=params[1]["value"]),
        )
    if dist == "log_normal":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.lognorm.ppf(
                p, params[1]["value"], loc=0, scale=np.exp(params[1]["value"])
            )
        )
    if dist == "normal":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(st.norm.ppf(p, params[0]["value"], params[1]["value"]))
    if dist == "pareto":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(st.pareto.ppf(p, params[1]["value"], scale=params[0]["value"]))
    if dist == "student_t":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.t.ppf(p, params[0]["value"], params[1]["value"], params[2]["value"])
        )
    if dist == "uniform":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = [
            (1 - p[0]) * params[0]["value"] + p[0] * params[1]["value"],
            (1 - p[1]) * params[0]["value"] + p[1] * params[1]["value"],
        ]
    if dist == "von_mises":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(st.vonmises_line.ppf(p, params[1]["value"], loc=params[0]["value"]))
    if dist == "weibull":
        p = [0.025, 0.975] if ptiles is None else list(ptiles)
        x = list(
            st.weibull_min.ppf(p, params[0]["value"], loc=0, scale=params[1]["value"])
        )

    return x, p


def explore(
    dist=None,
    params=None,
    x_min=None,
    x_max=None,
    n=400,
    **kwargs,
):
    """
    Build interactive Bokeh app displaying a univariate
    probability distribution.

    Parameters
    ----------
    dist : str
        Name of distribution
    params : list of dicts
        A list of parameter specifications. Each entry in the list gives
        specifications for a parameter of the distribution stored as a
        dictionary. Each dictionary must have the following keys.
            name : str, name of the parameter
            start : float, starting point of slider for parameter (the
                smallest allowed value of the parameter)
            end : float, ending point of slider for parameter (the
                largest allowed value of the parameter)
            value : float, the value of the parameter that the slider
                takes initially. Must be between start and end.
            step : float, the step size for the slider
    x_min : float, default dependent on dist
        Minimum value that the random variable can take in plots.
    x_max : float, default dependent on dist
        Maximum value that the random variable can take in plots.
    n : int, default 400
        Number of points to use in making plots of PDF and CDF for
        continuous distributions. This should be large enough to give
        smooth plots.
    kwargs : dict
        Any kwargs to be passed to bokeh.plotting.figure().

    Returns
    -------
    output : Bokeh app
        An app to visualize the PDF/PMF and CDF. It can be displayed
        with bokeh.io.show(). If it is displayed in a notebook, the
        notebook_url kwarg should be specified.
    """
    dist = dist.lower()
    if dist in discrete_dists:
        discrete = True
    elif dist in continuous_dists:
        discrete = False
    else:
        dists = ", ".join(discrete_dists + continuous_dists)
        raise RuntimeError(
            f"distribution '{dist}' not supported. Allowed distributions are {dists}."
        )

    if dist == "gaussian":
        dist = "normal"
    if dist == "invgamma" or dist == 'inverse-gamma':
        dist = "inverse_gamma"
    if dist == "wald" or dist == "invgaussian" or dist == "invgauss" or dist == 'inverse-gaussian':
        dist = "inverse_gaussian"
    if dist == "lognormal" or dist == 'log-normal':
        dist = "log_normal"
    if dist == "halfnormal" or dist == "half-normal":
        dist = "half_normal"
    if dist == "halfcauchy" or dist == 'half-cauchy':
        dist = "half_cauchy"
    if dist == "halfstudent_t" or dist == 'half-student-t' or dist == 'half_student_t' or dist == 'halfstudentt':
        dist = "half_student_t"
    if dist == "vonmises":
        dist = "von_mises"

    # Name of JS class containing dist
    distjs = f"{_to_camel_case(dist)}Distribution"

    # Parse figure kwargs
    if "frame_height" not in kwargs and "height" not in kwargs:
        kwargs["frame_height"] = 175

    if "frame_width" not in kwargs and "width" not in kwargs:
        kwargs["frame_width"] = 300

    x_axis_label = kwargs.pop("x_axis_label", None)

    title = kwargs.pop("title", None)

    toolbar_location = kwargs.pop("toolbar_location", "right")

    if "y_axis_label" in kwargs:
        del kwargs["y_axis_label"]
        warnings.warn("kwargs `y_axis_label` is ignored.")

    p_y_axis_type = kwargs.pop("y_axis_type", "linear")

    # Load parameters
    params, x_min, x_max, x_axis_label, title = _load_params(
        dist, params, x_min, x_max, x_axis_label, title
    )
    x_quantset, p_quantset = _compute_quantile_setter_params(dist, params)

    for i, param in enumerate(params):
        if "is_int" not in param:
            params[i]["is_int"] = False
        if params[i]["is_int"]:
            params[i]["step"] = 1
            params[i]["start"] = int(params[i]["start"])

    if discrete:
        p_y_axis_label = "PMF"
    else:
        p_y_axis_label = "PDF"

    # Lock axes for Bernoulli and Categorical
    # Panning and zooming seem to work with Bokeh 3.6.0 and above.
    if "tools" not in kwargs:
        if dist in ["bernoulli", "categorical"]:
            kwargs["tools"] = "save"
        else:
            kwargs["tools"] = "pan,box_zoom,wheel_zoom,save,reset"

    p_p = bokeh.plotting.figure(
        x_axis_label=x_axis_label,
        y_axis_label=p_y_axis_label,
        y_axis_type=p_y_axis_type,
        title=title,
        **kwargs,
    )
    p_c = bokeh.plotting.figure(
        x_axis_label=x_axis_label,
        y_axis_label="CDF",
        y_axis_type="linear",
        title=" ",
        **kwargs,
    )

    # Style axis lables
    p_p.yaxis.axis_label_text_font_style = "normal"
    p_c.yaxis.axis_label_text_font_style = "normal"

    # Explicitly set x-range
    p_p.x_range = bokeh.models.Range1d(x_min, x_max)

    # Link the axes
    p_c.x_range = p_p.x_range

    # We now set all y_ranges for continous distributions to start at 0
    # The only eay of doing it specifically only for a few dists is commented out below.
    p_p.y_range.start = 0.0

    if dist in ("bernoulli", "categorical"):
        p_p.y_range.end = 1.0

    # # For a Beta or uniform distribution, we want to force zero for PDF axis
    # # to give appropriate scale
    # if dist in ("beta", "beta_phi_kappa", "uniform"):
    #     p_p.y_range.start = 0.0

    # # For Bernoulli and Categorical, explicitly set p_p y_range
    # if dist in ("bernoulli", "categorical"):
    #     p_p.y_range = bokeh.models.Range1d(-0.04, 1.04)

    # Explicit tickers for Bernoulli and Categorical
    if dist == "bernoulli":
        p_p.xaxis.ticker = [0, 1]
        p_c.xaxis.ticker = [0, 1]
    if dist == "categorical":
        p_p.xaxis.ticker = [1, 2, 3, 4]
        p_c.xaxis.ticker = [1, 2, 3, 4]

    # Make sure CDF y_range is zero to one
    p_c.y_range = bokeh.models.Range1d(0.0, 1.0)

    # Old way (commented out) with buffers
    # p_c.y_range = bokeh.models.Range1d(-0.04, 1.04)

    # Make array of parameter values
    param_vals = np.array([param["value"] for param in params])

    # Set up data for plot
    if discrete:
        x = np.arange(int(np.ceil(x_min)), int(np.floor(x_max)) + 1)
        x_c = np.empty(2 * len(x))
        x_c[::2] = x
        x_c[1::2] = x
        x_c = np.concatenate(
            (
                (x_min,),
                x_c,
                (x_max,),
            )
        )
        x_cdf = np.concatenate(((x_c[0],), x))
    else:
        x = np.linspace(x_min, x_max, n)
        x_c = x_cdf = x

    # Compute PDF and CDF
    fun_p, fun_c = _funs(dist)
    y_p = fun_p(x, *param_vals)
    y_c = fun_c(x_cdf, *param_vals)
    if discrete:
        y_c_plot = np.empty_like(x_c)
        y_c_plot[::2] = y_c
        y_c_plot[1::2] = y_c
        y_c = y_c_plot

    # Set up data sources
    source_p = bokeh.models.ColumnDataSource(data={"x": x, "y_p": y_p})
    source_c = bokeh.models.ColumnDataSource(data={"x": x_c, "y_c": y_c})

    # Plot PMF/PDF and CDF
    p_c.line("x", "y_c", source=source_c, line_width=2, level="glyph")
    if discrete:
        p_p.scatter(
            "x", "y_p", source=source_p, size=5, marker="circle", level="glyph"
        )
        if p_y_axis_type != "log":
            p_p.segment(
                x0="x",
                x1="x",
                y0=0,
                y1="y_p",
                source=source_p,
                line_width=2,
                level="glyph",
            )
    else:
        p_p.line("x", "y_p", source=source_p, line_width=2, level="glyph")

    # In previous versions, range padding was set to 0 for convenience.
    # Now, ranges are explicitly set.
    # p_p.x_range.range_padding = 0
    # p_c.x_range.range_padding = 0

    # Sliders
    sliders = [
        bokeh.models.Slider(
            start=param["start"],
            end=param["end"],
            value=param["value"],
            step=param["step"],
            title=param["name"],
            width=200,
            format=bokeh.models.CustomJSTickFormatter(
                code="return tick.toPrecision(4)"
            ),
        )
        for param in params
    ]

    # Text boxes for setting slider ranges
    start_boxes = [
        bokeh.models.TextInput(value=str(param["start"]), width=70) for param in params
    ]
    end_boxes = [
        bokeh.models.TextInput(value=str(param["end"]), width=70) for param in params
    ]

    # Quantile setter text boxes
    x_boxes = [
        bokeh.models.TextInput(
            value=str("{0:.4f}".format(x_val)), width=80, disabled=True
        )
        for x_val in x_quantset
    ]
    p_boxes = [
        bokeh.models.TextInput(
            value=str("{0:.4f}".format(p_val)), width=80, disabled=True
        )
        for p_val in p_quantset
    ]

    # Div giving results of quantile setting
    quantile_setter_div = bokeh.models.Div(text="")

    # Adjust parameters vs quantile setter mode
    quantile_setter_switch = bokeh.models.Switch(active=False)

    # Invisible switch to retain whether or not recomputing of PDF/PMF
    # and CDF is triggered. Useful to keep off when redoing x-axes, etc.
    # while resetting, quantile setting, etc.
    trigger_callbacks = bokeh.models.Switch(active=True)

    # Build callback preamble, all necessary functions for calculations
    callback_preamble = ""
    for f in callbacks._dependencies["slider_callback"]:
        callback_preamble += callbacks._callbacks[f]

    for f in callbacks._dependencies[distjs]:
        callback_preamble += callbacks._callbacks[f]

    callback_preamble += callbacks._callbacks[distjs] + "\n\n"
    callback_preamble += f"\nvar dist = new {distjs}();\n\n"

    # Build code for callbacks that require the distribution
    slider_callback_code = callback_preamble + callbacks._callbacks["slider_callback"]
    xaxis_change_callback_code = (
        callback_preamble + callbacks._callbacks["xaxis_change_callback"]
    )
    quantile_setter_switch_callback_code = (
        callback_preamble + callbacks._callbacks["quantile_setter_switch_callback"]
    )
    quantile_setter_callback_code = (
        callback_preamble + callbacks._callbacks["quantile_setter_callback"]
    )
    reset_button_callback_code = (
        callback_preamble + callbacks._callbacks["reset_button_callback"]
    )

    # Build the callback CustomJS objects from the code with args. Just pass all args
    # to all callbacks for simplicity. Note also that when building callbacks, lists
    # have to be rebuilt to avoid circular references in serialization and the args need
    # to be created for each callback.
    def _build_args():
        return dict(
            p_p=p_p,
            p_c=p_c,
            source_p=source_p,
            source_c=source_c,
            discrete=discrete,
            n=n,
            sliders=[slider for slider in sliders],
            xBoxes=[x_box for x_box in x_boxes],
            pBoxes=[p_box for p_box in p_boxes],
            quantileSetterSwitch=quantile_setter_switch,
            quantileSetterDiv=quantile_setter_div,
            triggerCallbacks=trigger_callbacks,
            startBoxes=[start_box for start_box in start_boxes],
            endBoxes=[end_box for end_box in end_boxes],
        )

    # Now make callbacks
    slider_callback = bokeh.models.CustomJS(
        args=_build_args(),
        code=slider_callback_code,
    )

    xaxis_change_callback = bokeh.models.CustomJS(
        args=_build_args(),
        code=xaxis_change_callback_code,
    )

    quantile_setter_switch_callback = bokeh.models.CustomJS(
        args=_build_args(),
        code=quantile_setter_switch_callback_code,
    )

    quantile_setter_callback = bokeh.models.CustomJS(
        args=_build_args(),
        code=quantile_setter_callback_code,
    )

    reset_button_callback = bokeh.models.CustomJS(
        args=_build_args(),
        code=reset_button_callback_code,
    )

    # Create and link callbacks for setting slider ranges
    for param, slider, start, end in zip(params, sliders, start_boxes, end_boxes):
        args = dict(
            minValue=param["min_value"],
            maxValue=param["max_value"],
            slider=slider,
        )
        if param["is_int"]:
            cb_start = bokeh.models.CustomJS(
                args=args, code=callbacks._callbacks["int_slider_start_callback"]
            )
            cb_end = bokeh.models.CustomJS(
                args=args, code=callbacks._callbacks["int_slider_end_callback"]
            )
        else:
            cb_start = bokeh.models.CustomJS(
                args=args, code=callbacks._callbacks["slider_start_callback"]
            )
            cb_end = bokeh.models.CustomJS(
                args=args, code=callbacks._callbacks["slider_end_callback"]
            )

        start.js_on_change("value", cb_start)
        end.js_on_change("value", cb_end)

    # Link callback to sliders
    for slider in sliders:
        slider.js_on_change("value", slider_callback)

    # Link callback upon changing x-axis ranges
    p_p.x_range.js_on_change("start", xaxis_change_callback)
    p_p.x_range.js_on_change("end", xaxis_change_callback)

    # Link quantile setters switch
    quantile_setter_switch.js_on_change("active", quantile_setter_switch_callback)

    # Link quantile setter boxes
    for x_box in x_boxes:
        x_box.js_on_change("value", quantile_setter_callback)
    for p_box in p_boxes:
        p_box.js_on_change("value", quantile_setter_callback)

    # Link callbacks to reset button (not for Bernoulli and Categorical)
    if dist not in ["bernoulli", "categorical"]:
        p_c.js_on_event(bokeh.events.Reset, reset_button_callback)

    # Layout with label for switch
    quantile_setter_switch_with_label = bokeh.layouts.row(
        bokeh.models.Div(text="<p><b>Quantile setter mode</b></p>"),
        bokeh.models.Spacer(width=2),
        quantile_setter_switch,
    )

    # Layout of quantile setter text boxes
    if len(x_boxes) == 1:
        quantile_setter_text_boxes = bokeh.layouts.layout(
            [
                [
                    bokeh.models.Spacer(width=20),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text=f"<p><b>{x_axis_label}: </b></p>"),
                    ),
                    x_boxes[0],
                    bokeh.models.Spacer(width=16),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text="<p><b>quantile: </b></p>"),
                    ),
                    p_boxes[0],
                ]
            ]
        )
    elif len(x_boxes) == 2:
        quantile_setter_text_boxes = bokeh.layouts.layout(
            [
                [
                    bokeh.models.Spacer(width=20),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text=f"<p><b>lower {x_axis_label}: </b></p>"),
                    ),
                    x_boxes[0],
                    bokeh.models.Spacer(width=34),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text=f"<p><b>upper {x_axis_label}: </b></p>"),
                    ),
                    x_boxes[1],
                ],
                [
                    bokeh.models.Spacer(width=16),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text="<p><b>quantile: </b></p>"),
                    ),
                    p_boxes[0],
                    bokeh.models.Spacer(width=30),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text="<p><b>quantile: </b></p>"),
                    ),
                    p_boxes[1],
                ],
            ]
        )
    elif len(x_boxes) == 3:
        quantile_setter_text_boxes = bokeh.layouts.layout(
            [
                [
                    bokeh.models.Spacer(width=28),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text="<p><b>upper quantile: </b></p>"),
                    ),
                    p_boxes[2],
                    bokeh.models.Spacer(width=18),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text=f"<p><b>upper {x_axis_label}: </b></p>"),
                    ),
                    x_boxes[2],
                ],
                [
                    bokeh.models.Spacer(width=25),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text="<p><b>middle quantile: </b></p>"),
                    ),
                    p_boxes[1],
                    bokeh.models.Spacer(width=15),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text=f"<p><b>middle {x_axis_label}: </b></p>"),
                    ),
                    x_boxes[1],
                ],
                [
                    bokeh.models.Spacer(width=30),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text="<p><b>lower quantile: </b></p>"),
                    ),
                    p_boxes[0],
                    bokeh.models.Spacer(width=20),
                    bokeh.layouts.column(
                        bokeh.models.Spacer(height=7),
                        bokeh.models.Div(text=f"<p><b>lower {x_axis_label}: </b></p>"),
                    ),
                    x_boxes[0],
                ],
            ]
        )

    # Layout of sliders with text boxes
    widgets = bokeh.layouts.layout(
        [
            [
                bokeh.layouts.column(bokeh.models.Spacer(height=4), start),
                slider,
                bokeh.layouts.column(bokeh.models.Spacer(height=4), end),
            ]
            for start, slider, end in zip(start_boxes, sliders, end_boxes)
        ]
    )

    # Layout plots next to each other
    grid = bokeh.layouts.gridplot(
        [p_p, bokeh.layouts.Spacer(width=30), p_c],
        ncols=3,
        toolbar_location=toolbar_location,
    )

    # Put the layout together and return
    if len(x_boxes) > 0:
        return_layout = bokeh.layouts.column(
            bokeh.layouts.row(
                bokeh.models.Spacer(width=409),
                quantile_setter_switch_with_label,
                bokeh.models.Spacer(width=10),
                quantile_setter_div,
            ),
            bokeh.layouts.Spacer(height=10),
            bokeh.layouts.row(
                widgets, bokeh.models.Spacer(width=20), quantile_setter_text_boxes
            ),
            bokeh.layouts.Spacer(height=10),
            grid,
        )
    else:
        return_layout = bokeh.layouts.column(
            bokeh.layouts.Spacer(height=10),
            widgets,
            bokeh.layouts.Spacer(height=10),
            grid,
        )

    return return_layout
