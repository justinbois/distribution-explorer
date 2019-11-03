function bernoulli_prob(x, theta, {}, {}) {
	if (x == 0) return 1 - theta;
	else if (x == 1) return theta;
	else return 0.0;
}


function beta_binomial_prob(n, N, alpha, beta) {
    if (n > N || n < 0) return 0.0;

    return Math.exp(lnchoice(N, n)
                    + lnbeta(n+alpha, N-n+beta)
                    - lnbeta(alpha, beta));
}


function binomial_prob(n, N, theta, {}) {
    if (n > N || n < 0) return 0.0;

    if (theta == 0) {
        if (n == 0) return 1.0;
        return 0.0;
    }

    if (theta == 1) {
        if (n == N) return 1.0;
        return 0.0;
    }

    return Math.exp(lnchoice(N, n)
                    + n * Math.log(theta)
                    + (N - n) * Math.log(1-theta));
}


function categorical_prob(cat, theta1, theta2, theta3) {
    var theta4 = 1 - theta1 - theta2 - theta3
    if (theta4 < 0) return 0.0;
    if (![1, 2, 3, 4].includes(cat)) return 0.0;

    var probs = [theta1, theta2, theta3, theta4]

    return probs[cat-1];
}


function discrete_uniform_prob(n, low, high, {}) {
    if (low > high || n < low || n > high) return 0.0

    return 1 / (high - low + 1)
}


function geometric_prob(x, theta, {}, {}) {
	if (theta == 1) {
		if (x == 0) return 1.0;
		return 0.0;
	}

	if (x < 0 || theta == 0) return 0.0;

	return Math.exp(x * Math.log(1-theta) + Math.log(theta))
}


function hypergeometric_prob(n, N, a, b) {
    if (n < Math.max(0, N-b) || n > Math.min(N, a)) return 0.0;

    return Math.exp(lnchoice(a, n) + lnchoice(b, N-n) - lnchoice(a+b, N));
}


function negative_binomial_prob(y, alpha, beta, {}) {
    if (y  < 0) return 0.0;

    return Math.exp(lngamma(y + alpha)
                    - lngamma(alpha)
                    - lnfactorial(y)
                    + alpha * Math.log(beta / (1 + beta))
                    - y * Math.log(1 + beta));
}


function negative_binomial_mu_phi_prob(y, mu, phi, {}) {
    if (y  < 0) return 0.0;

    var alpha = phi;
    var beta = phi/mu;

    return Math.exp(lngamma(y + alpha)
                    - lngamma(alpha)
                    - lnfactorial(y)
                    + alpha * Math.log(beta / (1 + beta))
                    - y * Math.log(1 + beta));
}


function poisson_prob(n, lam, {}, {}) {
    if (n < 0) return 0.0;

    if (lam == 0) {
        if (n == 0) return 1.0;
        return 0.0;
    }

    return Math.exp(n * Math.log(lam)
                    - lnfactorial(n)
                    - lam);
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



function normal_prob(x, mu, sigma, {}) {
    var expTerm = (Math.pow(x-mu, 2) / 2.0 / Math.pow(sigma, 2))
    return Math.exp(-expTerm) / sigma / Math.sqrt(2 * Math.PI);
}


function normal_cdf(x, mu, sigma, {}) {
    return (1 + erf((x-mu) / sigma / Math.sqrt(2))) / 2;
}
