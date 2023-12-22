function bernoulli_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function binomial_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function categorical_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function discrete_uniform_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function geometric_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function hypergeometric_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function negative_binomial_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function negative_binomial_mu_phi_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function negative_binomial_r_b_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function poisson_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function beta_reset(p_p, p_c, source_p, param1, param2, {}) {
    p_p.x_range.start = 0.0;
    p_p.x_range.end = 1.0;
    set_y_ranges(p_p, p_c, source_p);  
}


function cauchy_reset(p_p, p_c, source_p, param1, param2, {}) {
    // Because of pathologically heavy tails, only go to 5th and 95th percentile
    let mu = param1;
    let sigma = param2;

    let x1 = mu + sigma * Math.tan(Math.PI * (0.05 - 0.5));
    let x2 = mu + sigma * Math.tan(Math.PI * (0.95 - 0.5));

    p_p.x_range.start = x1;
    p_p.x_range.end = x2;
    set_y_ranges(p_p, p_c, source_p);   
}


function exponential_reset(p_p, p_c, source_p, param1, param2, {}) {
    let beta = param1;

    p_p.x_range.start = 0.0;
    p_p.x_range.end = -Math.log(0.001) / beta;

    set_y_ranges(p_p, p_c, source_p);
}


function gamma_reset(p_p, p_c, source_p, param1, param2, {}) {
    let alpha = param1;
    let beta = param2;

    function rootFun(xi, alpha, beta, p) {
        let x = xi / (1 - xi);
        return p - gamma_cdf(x, alpha, beta, {});
    }

    let xi1 = brentSolve(rootFun, 0.0, 0.9999999, [alpha, beta, 0.001]);
    let xi2 = brentSolve(rootFun, 0.0, 0.9999999, [alpha, beta, 0.999]);


    if (xi1 != null && xi2 != null) {
        let x1 = xi1 / (1 - xi1);
        let x2 = xi2 / (1 - xi2);

        // If lower bound is within 10% of the range of bounds to zero, make it zero
        if (x1 < (x2 - x1) / 10.0) x1 = 0.0;

        p_p.x_range.start = x1;
        p_p.x_range.end = x2;
        set_y_ranges(p_p, p_c, source_p);
    }
}


function inverse_gamma_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function halfcauchy_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function halfnormal_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function half_student_t_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function lognormal_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


function normal_reset(p_p, p_c, source_p, param1, param2, {}) {
    let mu = param1;
    let sigma = param2;
    let sqrt2 = 1.4142135623730951;

    let x1 = mu + sqrt2 * erfinv(2 * 0.001 - 1);
    let x2 = mu + sqrt2 * erfinv(2 * 0.999 - 1);

    p_p.x_range.start = x1;
    p_p.x_range.end = x2;
    set_y_ranges(p_p, p_c, source_p);
}


function pareto_reset(p_p, p_c, source_p, param1, param2, {}) {
    let ymin = param1;
    let alpha = param2;

    // Show until PDF gets to 1/100 of max.
    let p = 0.01;

    let x1 = ymin;
    let logx2 = Math.log(ymin) - Math.log(p) / (1 + alpha);
    let x2 = Math.exp(logx2);

    p_p.x_range.start = x1;
    p_p.x_range.end = x2;
    set_y_ranges(p_p, p_c, source_p);    
}


function student_t_reset(p_p, p_c, source_p, param1, param2, param3) {
    let nu = param1;
    let mu = param2;
    let sigma = param3;

    function rootFun(xi, nu, mu, sigma, p) {
        let x = -Math.log(1.0 / xi - 1.0);
        return p - student_t_cdf(x, nu, mu, sigma);
    }

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

    let xi1 = brentSolve(rootFun, 0.0000001, 0.9999999, [nu, mu, sigma, p1]);
    let xi2 = brentSolve(rootFun, 0.0000001, 0.9999999, [nu, mu, sigma, p2]);

    if (xi1 !== null && xi2 !== null) {
        let x1 = -Math.log(1.0 / xi1 - 1.0);
        let x2 = -Math.log(1.0 / xi2 - 1.0);

        p_p.x_range.start = x1;
        p_p.x_range.end = x2;
        set_y_ranges(p_p, p_c, source_p);
    }
}


function uniform_reset(p_p, p_c, source_p, param1, param2, {}) {
    let alpha = param1;
    let beta = param2;
    let d = beta - alpha;

    if (d > 0) {
        let xmin = alpha - d * 0.1;
        let xmax = beta + d * 0.1;
        let py_min = 0.0;
        let py_max = 1.04 / (beta - alpha);
        let cy_min = -0.04;
        let cy_max = 1.04;
        p_p.x_range.start = xmin;
        p_p.x_range.end = xmax;
        p_p.y_range.start = py_min;
        p_p.y_range.end = py_max;
        p_c.y_range.start = cy_min;
        p_c.y_range.end = cy_max;

    }
}


function weibull_reset(p_p, p_c, source_p, param1, param2, {}) {
    return undefined;
}


