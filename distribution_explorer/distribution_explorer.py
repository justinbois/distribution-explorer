import numpy as np
import scipy.stats as st

import bokeh.plotting
import bokeh.models
import bokeh.layouts



# def _geometric_prob_code():
#     return """
#         function geometric_prob(x, theta) {
#             if (theta == 1) {
#               if (x == 0) {
#                 return 1.0;
#               }
#               return 0.0;
#             }

#             if (x < 0 || theta == 0) {
#                 return 0.0;
#             }

#             return Math.exp(x * Math.log(1-theta) + Math.log(theta))
#         }
#     """


# def _negative_binomial_prob_code():
#     return _lnfactorial_code() + _lngamma_code() + """
#         function negative_binomial_prob(y, alpha, beta) {
#             if (y  < 0) {
#               return 0.0;
#             }

#             return Math.exp(lngamma(y + alpha)
#                             - lngamma(alpha)
#                             - lnfactorial(y)
#                             + alpha * Math.log(beta / (1 + beta))
#                             - y * Math.log(1 + beta));
#         }
#         """


# def _binomial_prob_code():
#     return _lnfactorial_code() + """
#         function binomial_prob(n, N, theta) {
#             if (n > N || n < 0) {
#               return 0.0;
#             }

#             if (theta == 0) {
#               if (n == 0) {
#                 return 1.0;
#               }
#               return 0.0;
#             }

#             if (theta == 1) {
#               if (n == N) {
#                 return 1.0;
#               }
#               return 0.0;
#             }

#             return Math.exp(lnfactorial(N)
#                             - lnfactorial(N - x_p[i])
#                             - lnfactorial(x_p[i])
#                             + x_p[i] * Math.log(theta)
#                             + (N - x_p[i]) * Math.log(1-theta));
#         }
#         """


# def _discrete_cdf_code():
#     return """
#         function discrete_cdf(sum, y_p, y_c) {
#             y_c[0] = sum;
#             y_c[1] = sum;
#             for (var i = 0; i < y_p.length; i++) {
#                 sum += y_p[i];
#                 y_c[2*(i+1)] = sum;
#                 y_c[2*(i+1)+1] = sum;
#             }
#             return y_c;
#         }
#         """

# def _callback_code(dist):
#     if dist == 'bernoulli':
#         return """
#             var data_p = source_p.data;
#             var data_c = source_c.data;
#             var theta = arg_1.value
#             var y_p = data_p['y_p']
#             var y_c = data_c['y_c']
#             y_p[0] = 1 - theta
#             y_p[1] = theta
#             y_c[2] = 1 - theta
#             y_c[3] = 1 - theta
#             source_p.change.emit();
#             source_c.change.emit();
#         """
#     elif dist == 'geometric':
#         return _geometric_prob_code() + _discrete_cdf_code() + """
#             var data_p = source_p.data;
#             var data_c = source_c.data;
#             var theta = arg_1.value
#             var x_p = data_p['x']
#             var x_c = data_c['x']
#             var y_p = data_p['y_p']
#             var y_c = data_c['y_c']
#             for (var i = 0; i < x_p.length; i++) {
#               y_p[i] = geometric_prob(x_p[i], theta);
#             }

#             var sum = 0.0
#             for (var i = 0; i < x_p[0]; i++) {
#                 sum += geometric_prob_prob(x_p[i], theta);
#             }
#             y_c = discrete_cdf(sum, y_p, y_c);

#             source_p.change.emit();
#             source_c.change.emit();
#         """
#     elif dist == 'binomial':
#         return _binomial_prob_code() + _discrete_cdf_code() + """
#             var data_p = source_p.data;
#             var data_c = source_c.data;
#             var N = arg_1.value;
#             var theta = arg_2.value;
#             var x_p = data_p['x']
#             var x_c = data_c['x']
#             var y_p = data_p['y_p']
#             var y_c = data_c['y_c']
#             for (var i = 0; i < x_p.length; i++) {
#                   y_p[i] = binomial_prob(x_p[i], N, theta);
#             }

#             var sum = 0.0
#             for (var i = 0; i < x_p[0]; i++) {
#                 sum += binomial_prob(x_p[i], N, theta);
#             }
#             y_c = discrete_cdf(sum, y_p, y_c);

#             source_p.change.emit();
#             source_c.change.emit();
#         """
#     elif dist == 'negative_binomial':
#         return _negative_binomial_prob_code() + _discrete_cdf_code() + """
#             var data_p = source_p.data;
#             var data_c = source_c.data;
#             var alpha = arg_1.value;
#             var beta = arg_2.value;
#             var x_p = data_p['x']
#             var x_c = data_c['x']
#             var y_p = data_p['y_p']
#             var y_c = data_c['y_c']

#             for (var i = 0; i < x_p.length; i++) {
#                   y_p[i] = negative_binomial_prob(x_p[i], alpha, beta);
#             }

#             var sum = 0.0
#             for (var i = 0; i < x_p[0]; i++) {
#                 sum += negative_binomial_prob(x_p[i], alpha, beta);
#             }
#             y_c = discrete_cdf(sum, y_p, y_c);

#             source_p.change.emit();
#             source_c.change.emit();
#         """
#     else:
#         raise RuntimeError('Distribution not included.')


def _callback_code():
    with open('/Users/bois/Dropbox/git/distribution-explorer/distribution_explorer/callback_code.js') as f:
        return f.read()

def _funs(dist):
    if dist == 'bernoulli':
        return st.bernoulli.pmf, st.bernoulli.cdf
    elif dist == 'geometric':
        return (lambda x, theta: st.geom.pmf(x, theta, -1),
                lambda x, theta: st.geom.cdf(x, theta, -1))
    elif dist == 'binomial':
        return st.binom.pmf, st.binom.cdf
    elif dist == 'binomial':
        return st.binom.pmf, st.binom.cdf
    elif dist == 'negative_binomial':
        return (lambda x, alpha, beta: st.nbinom.pmf(x, alpha, beta/(1+beta)),
                lambda x, alpha, beta: st.nbinom.cdf(x, alpha, beta/(1+beta)))
    else:
        raise RuntimeError('Distribution not included.')


def _discrete_dists():
    return ['bernoulli',
            'geometric',
            'negative_binomial',
            'negative_binomial_mu_phi',
            'binomial',
            'poisson',
            'categorical',
            'discrete_uniform']


def explore(dist=None, x_min=None, x_max=None,
    x_axis_type='linear', y_axis_type='linear',
    params=None, n=400, plot_height=200, plot_width=300, x_axis_label='x',
    title=None):
    """
    Build interactive Bokeh app displaying a univariate
    probability distribution.

    Parameters
    ----------
    x_min : float
        Minimum value that the random variable can take in plots.
    x_max : float
        Maximum value that the random variable can take in plots.
    adjustable_xrange: bool, default False
        If True, allow for adjusting the range for which the PMF/PDF and
        CDF are calculated. You can always zoom in and out, but if you
        zoom far out, the values of the PMF/PDF and CDF are not
        calculated unless you specify.
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
    x_axis_label : str, default 'x'
        Label for x-axis.
    title : str, default None
        Title to be displayed above the PDF or PMF plot.

    Returns
    -------
    output : Bokeh app
        An app to visualize the PDF/PMF and CDF. It can be displayed
        with bokeh.io.show(). If it is displayed in a notebook, the
        notebook_url kwarg should be specified.
    """
    if None in [x_min, x_max]:
        raise RuntimeError('`x_min` and `x_max` must be specified.')

    dist = dist.lower()
    if dist in _discrete_dists():
        discrete = True
    else:
        discrete = False

    if discrete:
        p_y_axis_label = 'PMF'
    else:
        p_y_axis_label = 'PDF'

    if params is None:
        raise RuntimeError('`params` must be specified.')


    p_p = bokeh.plotting.figure(plot_height=plot_height,
                                plot_width=plot_width,
                                x_axis_label=x_axis_label,
                                y_axis_label=p_y_axis_label,
                                x_axis_type=x_axis_type,
                                y_axis_type=y_axis_type,
                                title=title)
    p_c = bokeh.plotting.figure(plot_height=plot_height,
                                plot_width=plot_width,
                                x_axis_label=x_axis_label,
                                y_axis_label='CDF',
                                x_axis_type=x_axis_type,
                                y_axis_type='linear')

    # Link the axes
    p_c.x_range = p_p.x_range

    # Make sure CDF y_range is zero to one
    p_c.y_range = bokeh.models.Range1d(-0.05, 1.05)

    # Make array of parameter values
    param_vals = np.array([param['value'] for param in params])

    # Set up data for plot
    if discrete:
        x = np.arange(int(np.ceil(x_min)),
                      int(np.floor(x_max))+1)
        x_size = x[-1] - x[0]
        x_c = np.empty(2*len(x))
        x_c[::2] = x
        x_c[1::2] = x
        x_c = np.concatenate(((max(x[0] - 0.05*x_size, x[0] - 0.95),),
                              x_c,
                              (min(x[-1] + 0.05*x_size, x[-1] + 0.95),)))
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
    source_p = bokeh.models.ColumnDataSource(data={'x': x,
                                                   'y_p': y_p})
    source_c = bokeh.models.ColumnDataSource(data={'x': x_c,
                                                   'y_c': y_c})

    # Plot PMF/PDF and CDF
    p_c.line('x', 'y_c', source=source_c, line_width=2)
    if discrete:
        p_p.circle('x', 'y_p', source=source_p, size=5)
        if y_axis_type != 'log':
            p_p.segment(x0='x',
                        x1='x',
                        y0=0,
                        y1='y_p',
                        source=source_p,
                        line_width=2)
    else:
        p_p.line('x', 'y_p', source=source_p, line_width=2)

    p_p.x_range.range_padding = 0
    p_c.x_range.range_padding = 0

    callback = bokeh.models.CustomJS(
        args=dict(source_p=source_p, source_c=source_c, dist=dist,
                  discrete=discrete, xrange=p_p.x_range),
        code=_callback_code())


    sliders = [bokeh.models.Slider(start=param['start'],
                                   end=param['end'],
                                   value=param['value'],
                                   step=param['step'],
                                   title=param['name'])
                        for param in params]
    for i, slider in enumerate(sliders):
        callback.args['arg'+str(i+1)] = slider
        slider.js_on_change('value', callback)
    if len(sliders) < 3:
        for i in range(len(sliders), 3):
            callback.args['arg'+str(i+1)] = sliders[0]

    if dist not in ['bernoulli', 'categorical']:
        p_p.x_range.callback = callback

    # Layout plots next to each other
    grid = bokeh.layouts.gridplot([p_p, p_c], ncols=2)
    widgets = bokeh.layouts.widgetbox(sliders)

    # Put the layout together and return
    return bokeh.layouts.column(widgets, grid)
