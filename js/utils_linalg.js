/*
 * Transpose of a matrix A.
 */
function transpose(A) {
    return A[0].map((_, colIndex) => A.map(row => row[colIndex]));
}


/*
 * Compute dot product A . v, where A is a matrix.
 */
function mvMult(A, v) {
  return A.map(Arow => dot(Arow, v));
}


/*
 * Multiply vector v by scalar a.
 */
function svMult(a, v) {
  return v.map(x => a * x);
}


/*
 * Multiply matrix A by scalar a.
 */
function smMult(a, A) {
  return A.map(Arow => svMult(a, Arow));
}


/*
 * Add a scalar a to every element of vector v.
 */
function svAdd(a, v) {
  return v.map(x => a + x);
}

/*
 * Matrix-matrix multiplication.
 */

function mmMult(A, B) {
  let mA = A.length;
  let nA = A[0].length;
  let mB = B.length;
  let nB = B[0].length;

  if (nA !== mB) {
      throw new Error('Matrix dimension mismatch.');
  }

  let result = zeros(mA, nB);

  for (let i = 0; i < mA; i++) {
    for (let j = 0; j < nB; j++) {
      for (let k = 0; k < nA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }

  return result;
}


/*
 * Add an abritrary number of vectors together elementwise.
 */
function vectorAdd() {
  let m = arguments.length;
  let n = arguments[0].length;
 
  let result = new Array(n).fill(0.0);
 
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
        result[i] += arguments[j][i];
    }
  }

  return result;
}

/*
 * Compute v1 / v2 elementwise.
 */
function elementwiseVectorDivide(v1, v2) {
  return v1.map((value, i) => value / v2[i]);
}


/*
 * Compute v1 * v2 elementwise.
 */
function elementwiseVectorMult(v1, v2) {
  return v1.map((value, i) => value * v2[i]);
}


/*
 * Add a set of vectors together, each multiplied by a scalar.
 */
function svMultAdd(scalars, vectors) {
  let m = scalars.length;
  let n = vectors[0].length;

  if (vectors.length != m) {
      console.warn("svMultAdd: Different number of scalars and vectors.");
      return null;
  }

  let result = new Array(n).fill(0.0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      result[i] += scalars[j] * vectors[j][i];
    }
  }

  return result;
}


function absVector(v) {
  return v.map(x => Math.abs(x));
}


/*
 * Compute dot product v1 . v2.
 */
function dot(v1, v2) {
  const n = v1.length;
  var result = 0.0;
  for (let i = 0; i < n; i++) result += v1[i] * v2[i];

  return result;
}


/*
 * 2-norm of a vector
 */
function norm(v) {
  return Math.sqrt(dot(v, v));
}


/**
 * Compute the quadratic form x^T A x.
 */
function quadForm(A, x) {
   return dot(x, mvMult(A, x)); 
}

/**
 * Make a shallow copy of a matrix.
 */
function shallowCopyMatrix(A) {
  var Ac = [];
  var n = A.length;
  for (i = 0; i < n; i++) {
      Ac.push([...A[i]]);
  }

  return Ac;
}

/**
 * Make a shallow copy of a matrix.
 */
function deepCopy(x) {
  return JSON.parse(JSON.stringify(x));
}

/**
 * Return an array of zeros shape given by arguments.
 */
function zeros(...dims) {
  let A = [];

  // Iterate over the dimensions in reverse order
  for (let i = dims.length - 1; i >= 0; i--) {
    let size = dims[i];
    if (i === dims.length - 1) {
      // Create the innermost dimension filled with zeros
      A = new Array(size).fill(0.0);
    } else {
      // Build the outer dimensions
      A = new Array(size).fill().map(() => deepCopy(A));
    }
  }

  return A;
}

/*
 * Solves the lower triangular system Lx = b.
 * Uses column-based forward substitution, outlined in algorithm
 * 3.1.3 of Golub and van Loan.
 * Parameters
 * ----------
 * L : ndarray
 *     Square lower triangulatar matrix (including diagonal)
 * b : ndarray, shape L.shape[0]
 *     Right hand side of Lx = b equation being solved.
 * Returns
 * -------
 * x : ndarray
 *     Solution to Lx = b.
 */
function lowerTriSolve(L, b) {
    const floatEps = 1.0e-14;
    const n = L.length;

    // Deep copy of b
    let x = Array.from(b);

    // Solve Lx = b.
    for (let j = 0; j < n - 1; j++) {
        if (Math.abs(L[j][j]) > floatEps) {
            x[j] /= L[j][j];
            for (let i = j + 1; i < n; i++) {
                x[i] -= x[j] * L[i][j];
            }
        } else {
            x[j] = 0.0;
        }
    }

    if (n > 0) {
        if (Math.abs(L[n - 1][n - 1]) > floatEps) {
            x[n - 1] /= L[n - 1][n - 1];
        } else {
            x[n - 1] = 0.0;
        }
    }

    return x;
}

/*
 * Solves the lower triangular system Ux = b.
 * Uses column-based forward substitution, outlined in algorithm
 * 3.1.4 of Golub and van Loan.
 * Parameters
 * ----------
 * U: ndarray
 *     Square upper triangulatar matrix (including diagonal)
 * b : ndarray, shape L.shape[0]
 *     Right hand side of Ux = b equation being solved.
 * Returns
 * -------
 * x : ndarray
 *     Solution to Ux = b.
 */
function upperTriSolve(U, b) {
    const floatEps = 1.0e-14;
    const n = U.length;

    // Deep copy of b
    let x = Array.from(b);

    // Solve Ux = b by back substitution.
    for (let j = n - 1; j > 0; j--) {
        if (Math.abs(U[j][j]) > floatEps) {
            x[j] /= U[j][j];
            for (let i = 0; i < j; i++) {
                x[i] -= x[j] * U[i][j];
            }
        } else {
            x[j] = 0.0;
        }
    }

    if (n > 0) {
        if (Math.abs(U[0][0]) > floatEps) {
            x[0] /= U[0][0];
        } else {
            x[0] = 0.0;
        }
    }

    return x;
}



/**
 * Modified Cholesky decomposition.
 * Performs modified Cholesky decomposition based on the algorithm
 * GMW81 in Fang, O'Leary, 2006. Modified Cholesky Algorithms: A Catalog
 * with New Approaches. From the matrix A
 * 
 * Parameters
 * ----------
 * A : ndarray
 *     Symmetric, real, positive definite or positive semidefinite
 *     matrix.
 * 
 * Returns
 * -------
 * L : ndarray, shape A.shape
 *     Lower triangulatar matrix with Cholesky decomposition
 * p : ndarray, shape A.shape[0]
 *     Permutation vector defining which columns of permutation matrix
 *     have ones.
 * success : bool
 *     True if Cholesky decomposition was successful and False otherwise,
 *     usually due to matrix not being positive semidefinite.
 * 
 * Notes
 * -----
 * .. A check of symmetry is not necessary in the context of EQTK,
 *    since we only work with symmetric matrices.
 */
function modifiedCholesky(A) {
    const floatEps = 1.0e-14;
    const n = A.length;

    // Deep copy of A
    let L = deepCopy(A); 
    let p = arange(0, n);

    // Keep track if factorization was successful
    let success = true;

    let xi = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
            let temp = Math.abs(L[i][j]);
            xi = Math.max(xi, temp);
        }
    }

    let eta = 0;
    for (let i = 0; i < n; i++) {
        let temp = Math.abs(L[i][i]);
        eta = Math.max(eta, temp);
    }

    let beta;
    if (n > 1) {
        beta = Math.sqrt(Math.max(eta, xi / Math.sqrt(n * n - 1)));
    } else {
        beta = Math.sqrt(eta);
    }
    beta = Math.max(beta, floatEps);

    for (let k = 0; k < n; k++) {
        // Pick a pivot
        let muVal = L[k][k];
        let mu = k;
        for (let i = k + 1; i < n; i++) {
            let temp = L[i][i];
            if (muVal < temp) {
                mu = i;
                muVal = temp;
            }
        }

        // Diagonal pivot k <=> mu
        let iTemp = p[mu];
        p[mu] = p[k];
        p[k] = iTemp;

        for (let i = 0; i < k; i++) {
            let temp = L[k][i];
            L[k][i] = L[mu][i];
            L[mu][i] = temp;
        }

        let temp = L[k][k];
        L[k][k] = L[mu][mu];
        L[mu][mu] = temp;
        for (let i = k + 1; i < mu; i++) {
            let temp = L[i][k];
            L[i][k] = L[mu][i];
            L[mu][i] = temp;
        }

        for (let i = mu + 1; i < n; i++) {
            let temp = L[i][k];
            L[i][k] = L[i][mu];
            L[i][mu] = temp;
        }

        // Compute c_sum
        let cSum = 0;
        for (let i = k + 1; i < n; i++) {
            cSum = Math.max(cSum, Math.abs(L[i][k]));
        }
        cSum /= beta;
        cSum = cSum * cSum;

        // Make sure L is semi-positive definite
        if (L[k][k] < 0) {
            success = false;
        }

        temp = Math.abs(L[k][k]);
        temp = Math.max(temp, floatEps * eta);
        temp = Math.max(temp, cSum);
        L[k][k] = Math.sqrt(temp);

        // Compute the current column of L
        for (let i = k + 1; i < n; i++) {
            L[i][k] /= L[k][k];
        }

        // Adjust the \bar{L}
        for (let j = k + 1; j < n; j++) {
            for (let i = j; i < n; i++) {
                L[i][j] -= L[i][k] * L[j][k];
            }
        }

        // Just keep lower triangle
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                L[i][j] = 0.0;
            }
        }
    }

    return [L, p, success];
}

/*
 * Solve system Ax = b, with P A P^T = L L^T post-Cholesky decomposition.
 * Parameters
 * ----------
 * L : ndarray
 *     Square lower triangulatar matrix from Cholesky decomposition
 * p : ndarray, shape L.shape[0]
 *     Permutation vector defining which columns of permutation matrix
 *     have ones.
 * b : ndarray, shape L.shape[0]
 *     Right hand side of Ax = b equation being solved.
 * Returns
 * -------
 * x : ndarray, shape L.shape[0]
 *     Solution to Ax = b.
 */
function modifiedCholeskySolve(L, p, b) {
    const n = L.length;

    let U = transpose(L);
    let xp = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        xp[i] = b[p[i]];
    }

    // Solve Ly = b storing y in xp.
    let x = lowerTriSolve(L, xp);

    // Solve Ux = y by back substitution.
    xp = upperTriSolve(U, x);

    for (let i = 0; i < n; i++) {
        x[p[i]] = xp[i];
    }

    return x;
}

function solvePosDef(A, b) {
  let [L, p, success] = modifiedCholesky(A);

  if (!success) {
    return [zeros(b.length), success];
  }

  return [modifiedCholeskySolve(L, p, b), success];
}

/*
 * LUP decomposition.
 */
function LUPDecompose(A, eps) {
    var i, j, k, imax;
    var maxA, absA;
    var Arow;
    var p = [];
    var n = A.length;
    var LU = shallowCopyMatrix(A);

    // Permutation matrix
    for (i = 0; i <= n; i++) p.push(i);

    for (i = 0; i < n; i++) {
        maxA = 0.0;
        imax = i;

        for (k = i; k < n; k++) {
            absA = Math.abs(LU[k][i]);
            if (absA > maxA) {
                maxA = absA;
                imax = k;
            }
        }

        // Failure; singular matrix
        if (maxA < eps) return [null, null];

        if (imax != i) {
            // Pivot
            j = p[i];
            p[i] = p[imax];
            p[imax] = j;

            // Pivot rows of A
            Arow = LU[i];
            LU[i] = LU[imax];
            LU[imax] = Arow;

            // Count pivots
            p[n]++;
        }

        for (j = i + 1; j < n; j++) {
            LU[j][i] /= LU[i][i];

            for (k = i + 1; k < n; k++) LU[j][k] -= LU[j][i] * LU[i][k];
        }
    }

    return [LU, p];
}


/*
 * Solve a linear system where LU and p are stored as the
 * output of LUPDecompose().
 */
function LUPSolve(LU, p, b) {
    var n = b.length;
    var x = [];

    for (var i = 0; i < n; i++) {
        x.push(b[p[i]]);
        for (var k = 0; k < i; k++) x[i] -= LU[i][k] * x[k];
    }

    for (i = n - 1; i >= 0; i--) {
        for (k = i + 1; k < n; k++) x[i] -= LU[i][k] * x[k];

        x[i] /= LU[i][i];
    }

    return x;
}


/*
 * Solve a linear system using LUP decomposition.
 *
 * Returns null if singular.
 */
function solve(A, b) {
    var eps = 1.0e-14;
    var LU, p;

    [LU, p] = LUPDecompose(A, eps);

    // Return null if singular
    if (LU === null) return null;

    return LUPSolve(LU, p, b);
}

module.exports = { transpose, mvMult, svMult, smMult, svAdd, mmMult, vectorAdd, elementwiseVectorDivide, elementwiseVectorMult, svMultAdd, absVector, dot, norm, quadForm, shallowCopyMatrix, deepCopy, zeros, lowerTriSolve, upperTriSolve, modifiedCholesky, modifiedCholeskySolve, solvePosDef, LUPDecompose, LUPSolve, solve };