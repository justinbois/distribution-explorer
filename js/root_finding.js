/**
 * Make a guess of parameters to give lowest function value
 */ 

/** 
 * Compute the Jacobian of vector-valued f at point x using central differencing
 * @param {function} f - vector-valued function we are computing the Jacobian for with call signature f(x, ...args)
 * @param {float} x - point where the Jacobian is calculated. Must be vector valued.
 * @param {array} args - arguments to pass to f
 * @param {float} eps - small number to use in central differencing
 * 
 */
function jacCentralDiff(f, x, args=[], eps=4.7e-6) {
	// Copys of x
	let xPlus = deepCopy(x);
	let xMinus = deepCopy(x);

	// Determine length of vector output of f
	let fOfx = f(x, ...args);
	let m = fOfx.length;

	// Number of columns in Jacobian
	let n = x.length;

	// Jacobian
	let J = zeros(m, n);

	// Intermetiate values
	let fOfxPlus;
	let fOfxMinus;

	for (let j = 0; j < n; j++) {
		xPlus[j] += eps;
		xMinus[j] -= eps;
		fOfxPlus = f(xPlus, ...args);
		fOfxMinus = f(xMinus, ...args);
		xPlus[j] -= eps;
		xMinus[j] += eps;

		for (let i = 0; i < m; i++) {
			J[i][j] = (fOfxPlus[i] - fOfxMinus[i]) / 2.0 / eps;
		}
	}

	return J;
}

function findRootTrustRegion(
		f, 
		x0, 
		args=[],
		jac=jacCentralDiff,
		tol=0.000000001, 
		maxIters=10000, 
		deltaBar=1000.0, 
		eta=0.125, 
		minDelta=1e-12
  ) {
	// Starting point
	let x = deepCopy(x0);

	// Trust region size
	let delta = 0.99 * deltaBar;

	// Function value at initial point
	let r = f(x, ...args);

	// Jacobian at initial point
	let J = jac(f, x, args);

	// J transpose dotted with J
	let JTJ = mmMult(transpose(J), J);

	// J transpose dotted with r
	let JTr = mvMult(transpose(J), r);

	// 2-norm of J transpose dotted with r
	let normJTr = norm(JTr);

	let iters = 0;
	while (iters < maxIters && checkTol(r, tol) && delta >= minDelta) {
		// Solve for search direction
		let p = doglegStep(JTJ, JTr, normJTr, delta);

		// Compute rho, ratio of actual to predicted reduction
		let newr = f(vectorAdd(x, p), ...args);
		let rho = computeRho(r, newr, J, p);

		// Adjust trust region size delta
		if  (rho < 0.25) {
			delta = norm(p) / 4.0;
		} else if (rho > 0.75 && Math.abs(norm(p) - delta) < 1e-12) {
				delta = Math.min(2 * delta, deltaBar);
		}

		// Take the step
		if (rho > eta) {
			x = vectorAdd(x, p);

			r = newr;
			J = jac(f, x, args);
			JTJ = mmMult(transpose(J), J);
			JTr = mvMult(transpose(J), r);
			normJTr = norm(JTr);
		}

		iters += 1;
	}

	console.log(iters);

	let success = !checkTol(r, tol);

	return [x, success];

}


function computeRho(r, newr, J, p) {
	let r2 = norm(r) ** 2;
	let num = r2 - norm(newr)**2;
	let denom = r2 - norm(vectorAdd(r, mvMult(J, p))) ** 2;

	return num / denom;
}


function checkTol(r, tol) {
	// Return false if tolerance is met.
	const n = r.length;
	for (let i = 0; i < n; i++) {
		if (tol < Math.abs(r[i])) return true;
	}

	return false;
}


function doglegStep(JTJ, JTr, normJTr, delta) {
	// Compute Newton step
	let [pJ, posDef] = solvePosDef(JTJ, JTr);
	pJ = svMult(-1.0, pJ);

	// If the Newton step is in the trust region, take it.
	if (posDef && norm(pJ) <= delta) {
		return pJ;
	}

	// Compute the Cauchy step
	let tau = Math.min(1, normJTr**3 / delta / quadForm(JTJ, JTr));
	let pC = svMult(-tau * delta / normJTr, JTr);

	// Take Cauchy step if we failed to compute pJ or if we're on the
	// boundary of the trust region
	let pCnorm = norm(pC);
	if (!posDef || Math.abs(pCnorm - delta) <= 1e-12) {
		return pC;
	}

	// Compute constants for quadratic formula solving ||pU + beta (pB-pU)||^2 = delta^2
	let pJ2 = norm(pJ) ** 2;
	let pC2 = pCnorm**2;
	let pJpC = dot(pJ, pC);
	let a = pJ2 + pC2 - 2.0 * pJpC;
	let b = 2.0 * (pJpC - pC2);
	let c = pC2 - delta**2;
	let q = -0.5 * (b + Math.sign(b) * Math.sqrt(b**2 - 4.0 * a * c));

	// Choose correct (positive) root. Don't worry about a = 0 because of pC ≈ pJ, then we already took Newton step
	let beta;
	if (Math.abs(b) < 1e-12) beta = Math.sqrt(-c / a);
	else if (b < 0.0) beta = q / a;
	else beta = c / q;

	// Take the dogleg step
	if (0.0 <= beta && beta <= 1) {
		return vectorAdd(pC, svMult(beta, vectorAdd(pJ, svMult(-1.0, pC))));
	} else { // Something is messed up; take Cauchy step (should never happen)
		return pC;
	}

}

/** 
 * Find a root of a scalar function f(x) using Newton's method.
 * @param {float} x0 - guess for root location
 * @param {function} f - function we are funding the root of with call signature f(x, ...args)
 * @param {function} df - derivative of function we are funding the root of with call signature df(x, ...args)
 * @param {array} args - arguments to pass to f and df
 * @param {float} tol - tolerance for convergence
 * @param {int} maxIter - maximum of Newton steps to take
 * @param {float} epsilon - small number. Abort if derivative is smaller than this.
 */
function newtonSolve(x0, f, df, args=[], tol=1e-8, maxIter=200, epsilon=1e-14) {
	let x = Infinity;
	let solved = false;

  for (let i = 0; i < maxIter; i++) {
      let y = f(x0, ...args);
      let yprime = df(x0, ...args);

      if (Math.abs(yprime) < epsilon) {
      	break;
			}

      x = x0 - y / yprime;

      if (Math.abs(x - x0) <= tol) {
      	solved = true;
      	break;
      }

      x0 = x;
  }

  if (solved) return x;
  else return null;
}


/** 
 * Find a root of a scalar function f(x) using the secant method.
 * @param {float} x0 - guess for root location
 * @param {function} f - function we are funding the root of with call signature f(x, ...args)
 * @param {function} df - derivative of function we are funding the root of with call signature df(x, ...args)
 * @param {array} args - arguments to pass to f and df
 * @param {float} tol - tolerance for convergence
 * @param {int} maxIter - maximum of steps to take
 * @param {float} epsilon - small number. Abort if derivative is smaller than this.
 * @param {float} h - small number. Secant method initialized with x0 * (1 + h).
 */
function secantSolve(x0, f, args=[], tol=1e-8, maxIter=200, epsilon=1e-14, h=1e-4) {
	let x = Infinity;
	let solved = false;

	let x1 = x0 * (1 + h);
	x1 += x1 >= 0 ? h : -h;

	let q0 = f(x0, ...args);
	let q1 = f(x1, ...args);
	
	if (Math.abs(q1) < Math.abs(q0)) {
		[x0, x1, q0, q1] = [x1, x0, q1, q0];
	}

	for (let i = 0; i < maxIter; i++) {
		if (q0 == q1) {
			solved = x0 == x1;
			x = (x0 + x1) / 2.0;
			break;
		}
		else {
			if (Math.abs(q1) > Math.abs(q0)) {
				x = (x0 - q0 / q1 * x1) / (1.0 - q0 / q1);
			}
			else {
				x = (x1 - q1 / q0 * x0) / (1.0 - q1 / q0);
			}
			if (Math.abs(x - x0) <= tol) {
				solved = true;
				break;
			}
			[x0, q0] = [x1, q1];
			x1 = x;
			q1 = f(x1, ...args);
		}
	}

  if (solved) return x;
  else return null;
}


/** 
 * Find a root of a scalar function f(x) using Brent's method.
 * @param {function} f - function we are funding the root of with call signature f(x, ...args)
 * @param {float} lower - lower bound for root
 * @param {float} upper - upper bound for root
 * @param {float} tol - tolerance for convergence
 * @param {int} maxIter - maximum of Newton steps to take
 */
function brentSolve(f, lower, upper, args=[], tol=1e-8, maxIter=1000) {
	let a = lower;
	let b = upper;
  let fa = f(a, ...args);
  let fb = f(b, ...args);

  // We may have already guessed the solution
  if (Math.abs(fa) < tol) return a;
  if (Math.abs(fb) < tol) return b;

  // Solution is not bracketed
  if (fa * fb >= 0) {
  	console.log('failed here', fa, fb, fa * fb);
  	return null;
	}

  // c is where we are closing in on the root
  let c = a;
  let fc = fa;

	let iter = 0;
  while (iter++ < maxIter) {
  	let prevStep = b - a;

    // Make sure a has the larger function value
    if (Math.abs(fc) < Math.abs(fb)) {      
    	[a, b, c] = [b, c, b];
    	[fa, fb, fc] = [fb, fc, fb];
    }

    // Next step toward root
    let newStep = (c - b) / 2.0;

    // Adjusted tolerance
    let tolAdj = 1e-15 * Math.abs(b) + tol / 2;

    // Found a root!
  	if (Math.abs(newStep) <= tolAdj || fb === 0 ) {
    		return b;
  	}

    // Try interpolation
    if (Math.abs(prevStep) > tolAdj && Math.abs(fa) > Math.abs(fb)) {
    	let p;
    	let q;
    	let t1;
    	let t2;
    	let cb = c - b;
    	if (a === c) { // a and c coincide, so try linear interpolation
    		t1 = fb / fa;
    		p = cb * t1;
    		q = 1.0 - t1;
    	}
    	else { // Use inverse quadratic interpolation
    		q = fa / fc;
    		t1 = fb / fc;
    		t2 = fb / fa;
    		p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1.0));
    		q = (q - 1.0) * (t1 - 1.0) * (t2 - 1.0);
    	}

    	// Fix the signs on p and q
    	if (p > 0) q = -q;
    	else p = -p;

    	// Accept the step if it's not too large and falls in interval
    	if (p < (0.75 * cb * q - Math.abs(tolAdj * q) / 2.0) 
    		&& p < Math.abs(prevStep * q / 2.0)) { 
	        newStep = p / q;
      	}
    }

    // If we can't do interpolation, do bisection
    // First make sure step is not smaller than the tolerance
    if (Math.abs(newStep) < tolAdj) {
      newStep = (newStep > 0) ? tolAdj : -tolAdj;
    }

    // Swap with the previous approximation
    a = b;
    fa = fb;

    // Take the step
    b += newStep;
    fb = f(b, ...args);

	// Adjust c so that the sign of f(c) is opposite f(b)
    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
      c = a; 
      fc = fa;
    }
  }

  // If we did not converge, return null
  return null;
}


module.exports = { jacCentralDiff, findRootTrustRegion, computeRho, checkTol, doglegStep, brentSolve, secantSolve, newtonSolve };
