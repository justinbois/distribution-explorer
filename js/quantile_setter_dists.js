function checkQuantileInput(x1, p1, x2, p2, n_checks, var_name, quantile_setter_div) {
    if (n_checks == 0) return true;

    if (p1 <= 0 || p1 >= 1) {
       quantile_setter_div.text = '<p style="color:tomato;">Must have 0 < quantile < 1.</p\>';
       return false; 
    }

    if (n_checks == 2) {
        if (p2 <= 0 || p2 >= 1) {
            quantile_setter_div.text = '<p style="color:tomato;">Must have 0 < quantile < 1.</p\>';
            return false;
        }

        if (p1 >= p2) {
            quantile_setter_div.text = '<p style="color:tomato;">Lower quantile must be less than upper quantile.</p\>';
            return false;
        }

        if (x1 >= x2) {
            quantile_setter_div.text = '<p style="color:tomato;">Lower xx must be less than upper xx.</p\>'.replace('xx', var_name);
            return false;        
        }
    }

    return true;
}


function bernoulli_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function binomial_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function categorical_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function discrete_uniform_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function geometric_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function hypergeometric_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function negative_binomial_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function negative_binomial_mu_phi_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function negative_binomial_r_b_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function poisson_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function beta_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
    starts,
    ends,
) {
    let theta1 = Number(x1_box.value);
    let p1 = Number(p1_box.value);
    let theta2 = Number(x2_box.value);
    let p2 = Number(p2_box.value);
    let alpha_slider= sliders[0];
    let beta_slider= sliders[1];
    let alpha_start = starts[0];
    let alpha_end = ends[0];
    let beta_start = starts[1];
    let beta_end = ends[1];

    let input_ok = checkQuantileInput(theta1, p1, theta2, p2, 2, 'θ', quantile_setter_div);

    if (theta1 <= 0 || theta1 >= 1 || theta2 <= 0 || theta1 >= 1) {
        quantile_setter_div.text = '<p style="color:tomato;">Must have 0 < θ < 1.</p\>';
        input_ok = false;
    }

    if (input_ok) {
        function quantileRootFindFunBeta(params, x1, p1, x2, p2) {
            let alpha = Math.exp(params.get(0, 0));
            let beta = Math.exp(params.get(1, 0));

            let r1 = beta_cdf(x1, alpha, beta, {}) - p1;
            let r2 = beta_cdf(x2, alpha, beta, {}) - p2;

            return Matrix.columnVector([r1, r2]);
        }

        function quantilePickBeta(x1, p1, x2, p2) {
            let args = [x1, p1, x2, p2];
            let guess = Matrix.columnVector([1.0, 1.0]);
            let [logParams, optimSuccess] = findRootTrustRegion(quantileRootFindFunBeta, guess, args=args);

            return [[Math.exp(logParams.get(0, 0)), Math.exp(logParams.get(1, 0))], optimSuccess];
        }

        let [[alpha, beta], optimSuccess] = quantilePickBeta(theta1, p1, theta2, p2);

        let text;
        if (optimSuccess) {
            text = '<p>α = ' + alpha.toPrecision(4) + ', ';
            text += 'β = ' + beta.toPrecision(4) + '</p>';
        } else {
            text = '<p style="color:tomato;">Failed to find parameters to match quantiles.</p>'
        }

        quantile_setter_div.text = text;

        // Update slider ranges to put parameter values in middle.
        if (alpha_slider.start > alpha || alpha_slider.end < alpha) {
            alpha_start.value = (4 * alpha / 1001).toPrecision(4);
            alpha_end.value = (4 * alpha).toPrecision(4);
        }
        alpha_slider.value = alpha;

        if (beta_slider.start > beta || beta_slider.end < beta) {
            beta_start.value = (4 * beta / 1001).toPrecision(4);
            beta_end.value = (4 * beta).toPrecision(4);
        }
        beta_slider.value = beta;
    }
}


function cauchy_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function exponential_quantile_setter(
    quantile_setter_div,
    y_box,
    p_box,
    {},
    {},
    sliders,
) {
    let y = Number(y_box.value);
    let p = Number(p_box.value);
    let beta_slider= sliders[0];
    let beta_start = starts[1];
    let beta_end = ends[1];

    let input_ok = checkQuantileInput(y, p, {}, {}, 1, 'y', quantile_setter_div);

    if (input_ok && y <= 0) {
        quantile_setter_div.text = '<p style="color:tomato;">y must be greater than zero.</p\>';
        input_ok = false;
    }

    if (input_ok) {
        let beta = -Math.log(1.0 - p) / y;
        quantile_setter_div.text = '<p>β = ' + beta.toPrecision(4) + '</p>';

        // Update slider ranges to put parameter values in middle.
        if (beta_slider.start > beta || beta_slider.end < beta) {
            beta_start.value = (4 * beta / 1001).toPrecision(4);
            beta_end.value = (4 * beta).toPrecision(4);
        }
        beta_slider.value = beta;

    }
}


function gamma_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function inverse_gamma_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function halfcauchy_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function halfnormal_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function half_student_t_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function lognormal_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function normal_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function pareto_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function student_t_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


function uniform_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
    starts,
    ends,
) {
    let x1 = Number(x1_box.value);
    let p1 = Number(p1_box.value);
    let x2 = Number(x2_box.value);
    let p2 = Number(p2_box.value);

    let alpha_slider= sliders[0];
    let beta_slider= sliders[1];

    let alpha_start = starts[0];
    let alpha_end = ends[0];
    let beta_start = starts[1];
    let beta_end = ends[1];

    let input_ok = checkQuantileInput(x1, p1, x2, p2, 2, 'y', quantile_setter_div);

    if (input_ok) {
        let alpha = (p2 * x1 - p1 * x2) / (p2 - p1);
        let beta = alpha + (x2 - x1) / (p2 - p1);
        quantile_setter_div.text = '<p>α = ' + alpha.toPrecision(4) + ', β = ' + beta.toPrecision(4) + '</p>';

        // Update slider ranges to put parameter values in middle.
        if (alpha_slider.start > alpha || alpha_slider.end < alpha) {
            alpha_start.value = (4 * alpha / 1001).toPrecision(4);
            alpha_end.value = (4 * alpha).toPrecision(4);
        }
        alpha_slider.value = alpha;

        if (beta_slider.start > beta || beta_slider.end < beta) {
            beta_start.value = (4 * beta / 1001).toPrecision(4);
            beta_end.value = (4 * beta).toPrecision(4);
        }
        beta_slider.value = beta;    }
}


function weibull_quantile_setter(
    quantile_setter_div,
    x1_box,
    p1_box,
    x2_box,
    p2_box,
    sliders,
) {
    return undefined;
}


