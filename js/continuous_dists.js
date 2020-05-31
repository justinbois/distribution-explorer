function beta_prob(x, alpha, beta, {}) {
    if (x < 0) return NaN;
    if (x > 1) return NaN;

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


function beta_cdf(x, alpha, beta, {}) {
    if (x < 0) return 0.0;
    if (x > 1) return 1.0;

    return regularized_incomplete_beta(x, alpha, beta);
}


function cauchy_prob(x, mu, sigma, {}) {
    return 1 / Math.PI / sigma / (1 + Math.pow((x - mu) / sigma, 2));
}


function cauchy_cdf(x, mu, sigma, {}) {
    return 0.5 + Math.atan((x - mu) / sigma) / Math.PI;
}


function exponential_prob(x, beta, {}, {}) {
    if (x < 0) return NaN;

    return beta * Math.exp(-beta * x);
}


function exponential_cdf(x, beta, {}, {}) {
    if (x < 0) return 0.0;

    return 1 - Math.exp(-beta * x);
}


function gamma_prob(x, alpha, beta, {}) {
    if (x < 0) return NaN;

    var ln_prob;

    ln_prob = alpha * Math.log(beta * x) - Math.log(x) - beta * x - lngamma(alpha);

    return Math.exp(ln_prob);
}


function gamma_cdf(x, alpha, beta, {}) {
    if (x < 0) return 0.0;

    return gammainc_l(beta*x, alpha, true);
}


function halfcauchy_prob(x, mu, sigma, {}) {
    if (x < mu) return NaN;

    return 2.0 / Math.PI / sigma / (1 + Math.pow((x - mu) / sigma, 2));
}


function halfcauchy_cdf(x, mu, sigma, {}) {
    if (x < mu) return 0.0;

    return 2.0 * Math.atan((x - mu) / sigma) / Math.PI;
}


function halfnormal_prob(x, mu, sigma, {}) {
    if (x < mu) return NaN;

    var expTerm = (Math.pow(x - mu, 2) / 2.0 / Math.pow(sigma, 2));
    return Math.exp(-expTerm) / sigma * Math.sqrt(2.0 / Math.PI);
}


function halfnormal_cdf(x, mu, sigma, {}) {
    if (x < mu) return 0.0;

    return erf((x - mu) / sigma / Math.sqrt(2));
}


function halfstudent_t_prob(x, nu, mu, sigma) {
    if (x < mu) return NaN;

    var lnprob;

    lnprob = Math.log(2.0) + lngamma((nu+1)/2) - lngamma(nu/2) - Math.log(Math.PI * nu) / 2 
             - Math.log(sigma) - (nu+1)/2 * log1p(Math.pow(x - mu, 2) / nu / Math.pow(sigma, 2));

    return Math.exp(lnprob);
}


function halfstudent_t_cdf(x, nu, mu, sigma) {
    if (x < mu) return 0.0;

    var y = (x - mu) / sigma;

    return 1 - regularized_incomplete_beta(nu / (y**2 + nu), 0.5*nu, 0.5);
}


function inverse_gamma_prob(x, alpha, beta, {}) {
    if (x < 0) return NaN;

    var ln_prob;

    ln_prob = alpha * Math.log(beta) - (alpha + 1) * Math.log(x) - beta / x - lngamma(alpha);

    return Math.exp(ln_prob);
}


function inverse_gamma_cdf(x, alpha, beta, {}) {
    if (x < 0) return 0.0;

    return gammainc_u(beta/x, alpha, true);
}


function lognormal_prob(x, mu, sigma, {}) {
    if (x <= 0) return NaN;

    var expTerm = (Math.pow(Math.log(x) - mu, 2) / 2.0 / Math.pow(sigma, 2))
    return Math.exp(-expTerm) / x / sigma / Math.sqrt(2 * Math.PI);
}


function lognormal_cdf(x, mu, sigma, {}) {
    if (x <= 0) return 0.0;

    return (1 + erf((Math.log(x) - mu) / sigma / Math.sqrt(2))) / 2;
}


function normal_prob(x, mu, sigma, {}) {
    var expTerm = (Math.pow(x - mu, 2) / 2.0 / Math.pow(sigma, 2));
    return Math.exp(-expTerm) / sigma / Math.sqrt(2 * Math.PI);
}


function normal_cdf(x, mu, sigma, {}) {
    return (1 + erf((x - mu) / sigma / Math.sqrt(2))) / 2;
}


function pareto_prob(x, y_min, alpha, {}) {
    if (x < y_min) return NaN;

    var logp = Math.log(alpha) + alpha * Math.log(y_min) - (alpha + 1) * Math.log(x); 
    return Math.exp(logp);
}


function pareto_cdf(x, y_min, alpha, {}) {
    if (x < y_min) return 0.0;

    return 1 - Math.pow(y_min / x, alpha);
}


function student_t_prob(x, nu, mu, sigma) {
    var lnprob;

    lnprob = lngamma((nu+1)/2) - lngamma(nu/2) - Math.log(Math.PI * nu) / 2 - Math.log(sigma)
             - (nu+1)/2 * log1p(Math.pow(x - mu, 2) / nu / Math.pow(sigma, 2));

    return Math.exp(lnprob);
}


function student_t_cdf(x, nu, mu, sigma) {
    var y = (x - mu) / sigma;

    if (y >= 0) {
        return 1 - regularized_incomplete_beta(nu / (y**2 + nu), 0.5*nu, 0.5) / 2;
    }
    else {
        return regularized_incomplete_beta(nu / (y**2 + nu), 0.5*nu, 0.5) / 2;        
    }
}


function uniform_prob(x, alpha, beta, {}) {
    if (beta <= alpha || x < alpha || x > beta) return NaN;

    return 1.0 / (beta - alpha);
}


function uniform_cdf(x, alpha, beta, {}) {
    if (beta <= alpha || x <= alpha) return 0.0;
    if (x >= beta) return 1.0;
    return (x - alpha) / (beta - alpha);
}


function weibull_prob(x, alpha, sigma, {}) {
    if (x < 0) return NaN;

    var logp = -Math.pow(x / sigma, alpha) + (alpha - 1) * Math.log(x) 
                + Math.log(alpha) - alpha * Math.log(sigma);

    return Math.exp(logp);
}


function weibull_cdf(x, alpha, sigma, {}) {
    if (x < 0) return 0.0;

    return 1 - Math.exp(-Math.pow(x / sigma, alpha));
}
