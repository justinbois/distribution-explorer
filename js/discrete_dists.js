function bernoulli_prob(x, theta, {}, {}) {
	if (x == 0) return 1 - theta;
	else if (x == 1) return theta;
	else return NaN;
}


function beta_binomial_prob(n, N, alpha, beta) {
    if (n > N || n < 0) return NaN;

    return Math.exp(lnchoice(N, n)
                    + lnbeta(n+alpha, N-n+beta)
                    - lnbeta(alpha, beta));
}


function binomial_prob(n, N, theta, {}) {
    if (n > N || n < 0) return NaN;

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
    if (![1, 2, 3, 4].includes(cat)) return NaN;

    var probs = [theta1, theta2, theta3, theta4]

    return probs[cat-1];
}


function discrete_uniform_prob(n, low, high, {}) {
    if (low > high || n < low || n > high) return NaN;

    return 1 / (high - low + 1);
}


function geometric_prob(x, theta, {}, {}) {
	if (theta == 1) {
		if (x == 0) return 1.0;
		return 0.0;
	}

    if (theta == 0) return 0.0;

    if (x < 0) return NaN;

	return Math.exp(x * Math.log(1-theta) + Math.log(theta));
}


function hypergeometric_prob(n, N, a, b) {
    if (n < Math.max(0, N-b) || n > Math.min(N, a)) return NaN;

    return Math.exp(lnchoice(a, n) + lnchoice(b, N-n) - lnchoice(a+b, N));
}


function negative_binomial_prob(y, alpha, beta, {}) {
    if (y < 0) return NaN;

    return Math.exp(lngamma(y + alpha)
                    - lngamma(alpha)
                    - lnfactorial(y)
                    + alpha * Math.log(beta / (1 + beta))
                    - y * Math.log(1 + beta));
}


function negative_binomial_mu_phi_prob(y, mu, phi, {}) {
    if (y < 0) return NaN;
    if (mu == 0 | phi == 0) return NaN;

    var logMuPhi = Math.log(mu + phi);

    return Math.exp(lngamma(y + phi)
                    - lngamma(phi)
                    - lnfactorial(y)
                    + phi * (Math.log(phi) - logMuPhi)
                    + y * (Math.log(mu) - logMuPhi));

}


function negative_binomial_r_b_prob(y, r, b, {}) {
    if (y < 0) return NaN;

    return Math.exp(lngamma(y + r)
                    - lngamma(r)
                    - lnfactorial(y)
                    + r * Math.log(1 / (1 + b))
                    - y * Math.log(1 + 1 / b));

}


function poisson_prob(n, lam, {}, {}) {
    if (n < 0) return NaN;

    if (lam == 0) {
        if (n == 0) return 1.0;
        return 0.0;
    }

    return Math.exp(n * Math.log(lam)
                    - lnfactorial(n)
                    - lam);
}
