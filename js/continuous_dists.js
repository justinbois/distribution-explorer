function normal_prob(x, mu, sigma, {}) {
    var expTerm = (Math.pow(x-mu, 2) / 2.0 / Math.pow(sigma, 2))
    return Math.exp(-expTerm) / sigma / Math.sqrt(2 * Math.PI);
}


function normal_cdf(x, mu, sigma, {}) {
    return (1 + erf((x-mu) / sigma / Math.sqrt(2))) / 2;
}


function uniform_prob(x, alpha, beta, {}) {
    if (beta <= alpha || x < alpha || x > beta) return 0.0;

    return 1 / (beta - alpha);
}


function uniform_cdf(x, alpha, beta, {}) {
    if (beta <= alpha || x <= alpha) return 0.0;
    if (x >= beta) return 1.0;
    return (x - alpha) / (beta - alpha);
}
