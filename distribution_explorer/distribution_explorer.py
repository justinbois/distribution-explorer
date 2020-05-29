import warnings

import numpy as np
import scipy.stats as st

import bokeh.plotting
import bokeh.models
import bokeh.layouts

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
    "poisson",
]

continuous_dists = [
    "beta",
    "cauchy",
    "exponential",
    "gamma",
    "halfcauchy",
    "halfnormal",
    "halfstudent_t",
    "inverse_gamma",
    "lognormal",
    "normal",
    "pareto",
    "student_t",
    "uniform",
    "weibull",
]


def _callback_code():
    with open(
        "/Users/bois/Dropbox/git/distribution-explorer/distribution_explorer/callback_code.js"
    ) as f:
        return f.read()


def _categorical_pmf(x, theta_1, theta_2, theta_3):
    thetas = np.array([theta_1, theta_2, theta_3, 1 - theta_1 - theta_2 - theta_3])
    if np.any(thetas < 0):
        return 0.0
    return thetas[x - 1]


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
            lambda x, mu, phi: st.nbinom.pmf(x, mu, phi / mu),
            lambda x, mu, phi: st.nbinom.cdf(x, mu, phi / mu),
        )
    elif dist == "poisson":
        return st.poisson.pmf, st.poisson.cdf
    elif dist == "beta":
        return st.beta.pdf, st.beta.cdf
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
    elif dist == "halfcauchy":
        return st.halfcauchy.pdf, st.halfcauchy.cdf
    elif dist == "halfnormal":
        return st.halfnorm.pdf, st.halfnorm.cdf
    elif dist == "halfstudent_t":
        return st.t.pdf, st.t.cdf
    elif dist == "inverse_gamma":
        return (
            lambda x, alpha, beta: st.invgamma.pdf(x, alpha, loc=0, scale=beta),
            lambda x, alpha, beta: st.invgamma.cdf(x, alpha, loc=0, scale=beta),
        )
    elif dist == "lognormal":
        return (
            lambda x, mu, sigma: st.lognorm.pdf(x, sigma, loc=0, scale=np.exp(mu)),
            lambda x, mu, sigma: st.lognorm.pdf(x, sigma, loc=0, scale=np.exp(mu)),
        )
    elif dist == "normal":
        return st.norm.pdf, st.norm.cdf
    elif dist == "pareto":
        return (
            lambda x, y_min, alpha: st.pareto.pdf(x, alpha, scale=y_min),
            lambda x, y_min, alpha: st.pareto.cdf(x, alpha, scale=y_min)
        )
    elif dist == "student_t":
        return st.t.pdf, st.t.cdf
    elif dist == "uniform":
        return (
            lambda x, alpha, beta: st.uniform.pdf(x, alpha, beta - alpha),
            lambda x, alpha, beta: st.uniform.cdf(x, alpha, beta - alpha),
        )
    elif dist == "weibull":
        return (
            lambda x, alpha, sigma: st.weibull_min.pdf(x, alpha, loc=0, scale=sigma),
            lambda x, alpha, sigma: st.weibull_min.cdf(x, alpha, loc=0, scale=sigma),
        )
    else:
        raise RuntimeError("Distribution not included.")


def _load_params(dist, _params, _x_min, _x_max, _x_axis_label, _title):
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
        x_min = 0
        x_max = 1
        x_axis_label = "y"
        title = "Bernoulli"
    elif dist == "binomial":
        params = [
            dict(
                name="N",
                start=1,
                end=20,
                value=5,
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
        x_min = 0
        x_max = 20
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
        x_min = 1
        x_max = 4
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
        x_min = 0
        x_max = 10
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
        x_min = 0
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
                start=0,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="β",
                start=0,
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
                start=0,
                end=20,
                value=5,
                step=0.01,
                is_int=False,
                min_value=0,
                max_value="Infinity",
            ),
            dict(
                name="φ",
                start=0,
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
    elif dist == "poisson":
        params = [
            dict(
                name="λ",
                start=0,
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
        x_max = 30
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
    elif dist == "half-cauchy" or dist == "halfcauchy":
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
    elif dist == "half-normal" or dist == "halfnormal":
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
    elif dist == "halfstudent_t":
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
    elif dist == "inverse_gamma":
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
    elif dist == "lognormal":
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


def explore(
    dist=None,
    params=None,
    x_min=None,
    x_max=None,
    n=400,
    slider_range_textbox=False,
    **kwargs,
):
    """
    Build interactive Bokeh app displaying a univariate
    probability distribution.

    Parameters
    ----------
    x_min : float, default dependent on dist
        Minimum value that the random variable can take in plots.
    x_max : float, default dependent on dist
        Maximum value that the random variable can take in plots.
    x_axis_type : Either 'linear' or 'log', default 'linear'
        Whether x-axis is linear or log scale. Applies to both PMF/PDF
        and CDF.
    y_axis_type : Either 'linear' or 'log', default 'linear'
        Whether y-axis is linear or log scale. Applies only to PMF/PDF;
        the CDF always has a linear y-scale.
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
    n : int, default 400
        Number of points to use in making plots of PDF and CDF for
        continuous distributions. This should be large enough to give
        smooth plots.
    plot_height : int, default 200
        Height of plots.
    plot_width : int, default 300
        Width of plots.
    x_axis_label : str, default dependent on dist
        Label for x-axis.
    title : str, default None
        Title to be displayed above the PDF or PMF plot.
    slider_range_textbox: bool, default False
        If Bokeh is version number is 1.1.0 or above, text boxes used
        for setting the ranges on parameter values are provided. In
        earlier versions of Bokeh, a bug prevented proper layouts of the
        widgets (see https://github.com/bokeh/bokeh/issues/6427). If
        `slider_range_textbox` is True and the Bokeh version is less
        than 1.1.0, the poorly laid out text boxes are nonetheless
        shown.

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

    # Parse figure kwargs
    if "frame_height" not in kwargs and "plot_height" not in kwargs:
        kwargs["frame_height"] = 175

    if "frame_width" not in kwargs and "plot_width" not in kwargs:
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

    # Link the axes
    p_c.x_range = p_p.x_range

    # Make sure CDF y_range is zero to one
    p_c.y_range = bokeh.models.Range1d(-0.05, 1.05)

    # Make array of parameter values
    param_vals = np.array([param["value"] for param in params])

    # Set up data for plot
    if discrete:
        x = np.arange(int(np.ceil(x_min)), int(np.floor(x_max)) + 1)
        x_size = x[-1] - x[0]
        x_c = np.empty(2 * len(x))
        x_c[::2] = x
        x_c[1::2] = x
        x_c = np.concatenate(
            (
                (max(x[0] - 0.05 * x_size, x[0] - 0.95),),
                x_c,
                (min(x[-1] + 0.05 * x_size, x[-1] + 0.95),),
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
    p_c.line("x", "y_c", source=source_c, line_width=2)
    if discrete:
        p_p.circle("x", "y_p", source=source_p, size=5)
        if p_y_axis_type != "log":
            p_p.segment(x0="x", x1="x", y0=0, y1="y_p", source=source_p, line_width=2)
    else:
        p_p.line("x", "y_p", source=source_p, line_width=2)

    p_p.x_range.range_padding = 0
    p_c.x_range.range_padding = 0

    callback = bokeh.models.CustomJS(
        args=dict(
            source_p=source_p,
            source_c=source_c,
            dist=dist,
            discrete=discrete,
            xrange=p_p.x_range,
            n=n,
        ),
        code=callbacks.callbacks[dist],
    )

    # Sliders
    sliders = [
        bokeh.models.Slider(
            start=param["start"],
            end=param["end"],
            value=param["value"],
            step=param["step"],
            title=param["name"],
        )
        for param in params
    ]

    # Assign callbacks to sliders
    for i, slider in enumerate(sliders):
        callback.args["arg" + str(i + 1)] = slider
        slider.js_on_change("value", callback)
    if len(sliders) < 3:
        for i in range(len(sliders), 3):
            callback.args["arg" + str(i + 1)] = sliders[0]

    # Execute callback upon changing x-axis values
    if dist not in ["bernoulli", "categorical"]:
        p_p.x_range.callback = callback

    # Text boxes for setting slider ranges (Bokeh 1.1.0 and above)
    if bokeh.__version__ > "1.1.0" or slider_range_textbox:
        starts = [
            bokeh.models.TextInput(value=str(param["start"]), width=70)
            for param in params
        ]
        ends = [
            bokeh.models.TextInput(value=str(param["end"]), width=70)
            for param in params
        ]

        # Callbacks for setting slider ranges
        for param, slider, start, end in zip(params, sliders, starts, ends):
            args = dict(
                min_value=param["min_value"],
                max_value=param["max_value"],
                slider=slider,
            )
            if param["is_int"]:
                cb_start = bokeh.models.CustomJS(args=args, code=callbacks.start_int)
                cb_end = bokeh.models.CustomJS(args=args, code=callbacks.end_int)
            else:
                cb_start = bokeh.models.CustomJS(args=args, code=callbacks.start)
                cb_end = bokeh.models.CustomJS(args=args, code=callbacks.end)

            start.js_on_change("value", cb_start)
            end.js_on_change("value", cb_end)

        widgets = bokeh.layouts.layout(
            [[start, slider, end] for start, slider, end in zip(starts, sliders, ends)]
        )
    else:
        widgets = bokeh.layouts.widgetbox(sliders)

    # Layout plots next to each other
    grid = bokeh.layouts.gridplot(
        [p_p, bokeh.layouts.Spacer(width=30), p_c],
        ncols=3,
        toolbar_location=toolbar_location,
    )

    # Put the layout together and return
    return bokeh.layouts.column(widgets, bokeh.layouts.Spacer(height=10), grid)
