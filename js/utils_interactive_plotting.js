/**
 * Extract parameters from sliders.
 */
function paramsFromSliders(sliders) {
  let params = [];
  for (let slider of sliders) {
    params.push(slider.value);
  }

  return params;
}


/**
 * Extract desired quantiles from boxes.
 */
function paramsFromBoxes(boxes) {
  let params = [];
  for (let box of boxes) {
    if (isNaN(box.value)) {
      throw new Error(box.value + ' is not a valid number.');
    }
    params.push(Number(box.value));
  }

  return params;
}


/**
 * Set the y-ranges for PDF and CDF plots.
 */
function setYRanges(p_p, p_c, source_p) {
    p_c.y_range.start = -0.04;
    p_c.y_range.end = 1.04;        

    let pdfMax = source_p.data['y_p'];
    p_p.y_range.start = -pdfMax * 0.04;
    p_p.y_range.end = 1.04 * pdfMax;
}


/**
 * Check to make sure input into quantile setter is ok.
 */
function checkQuantileInput(x, p, xMin, xMax, varName, quantileSetterDiv) {
  for (let i = 0; i < x.length; i++) {
    if (p[i] <= 0 || p[i] >= 1) {
      quantileSetterDiv.text = '<p style="color:tomato;">Must have 0 < quantile < 1.</p\>';
      return false; 
    }

    if (x[i] < xMin || x[i] > xMax) {
      let qStr = '<p style="color:tomato;">Must have ' + xMin.toString() + ' ≤ yy ≤ ' + xMax.toString() + '.</p\>';
      quantileSetterDiv.text = qStr.replace(/yy/g, varName);
      return false;
    }
  }


  if (p.length === 2) {
    if (p[1] <= 0 || p[1] >= 1) {
        quantileSetterDiv.text = '<p style="color:tomato;">Must have 0 < quantile < 1.</p\>';
        return false;
    }

    if (p[0] >= p[1]) {
        quantileSetterDiv.text = '<p style="color:tomato;">Lower quantile must be less than upper quantile.</p\>';
        return false;
    }

    if (x[0] >= x[1]) {
        quantileSetterDiv.text = '<p style="color:tomato;">Lower yy must be less than upper yy.</p\>'.replace(/yy/g, varName);
        return false;        
    }
  }

  if (p.length === 3) {
    if (p[2] <= 0 || p[2] >= 1 || p[1] <= 0 || p[1] >= 1) {
        quantileSetterDiv.text = '<p style="color:tomato;">Must have 0 < quantile < 1.</p\>';
        return false;
    }

    if (p[0] >= p[1] || p[1] >= p[2]) {
        quantileSetterDiv.text = '<p style="color:tomato;">Quantiles must be ordered lower, middle, upper.</p\>';
        return false;
    }

    if (x[0] >= x[1] || x[1] >= x[2]) {
        quantileSetterDiv.text = '<p style="color:tomato;">yy values must be ordered, lower, middle, upper.</p\>'.replace(/yy/g, varName);
        return false;
    }
  }

    return true;
}


function updateContinuousPDFandCDF(source_p, source_c, xRange, sliders) {
  // Extract data from sources
  let x_p = source_p.data['x'];
  let y_p = source_p.data['y_p'];
  let x_c = source_c.data['x'];
  let y_c = source_c.data['y_c'];
  let xRangeMin = xRange.start;
  let xRangeMax = xRange.end;

  // x-values to evaluate PDF and CDF
  x_p = linspace(xRangeMin, xRangeMax, n);
  x_c = x_p;

  // Update sources with new x-values
  source_p.data['x'] = x_p;
  source_c.data['x'] = x_c;

  // Obtain parameter values
  let params = paramsFromSliders(sliders);

  // Compute PDF
  let pdf = dist.pdf(x_p, params);

  // Convert Infinity's to NaN's for plotting
  pdf = pdf.map(val => (val === Infinity || val === -Infinity) ? NaN : val);

  // Update the PDF and CDF
  source_p.data['y_p'] = pdf;
  source_c.data['y_c'] = dist.cdf(x_c, params);

  source_p.change.emit();
  source_c.change.emit();
}


function updateDiscretePMFandCDF(source_p, source_c, xRange, sliders) {
  // Extract data range
  let xRangeMin = Math.floor(xRange.start);
  let xRangeMax = Math.ceil(xRange.end);

  // x-values to evaluate PMF and CDF
  let x_p = arange(xRangeMin, xRangeMax + 1);

  // Set up x-values for plotting the staircase CDF
  let x_c = [xRangeMin - 1, ...x_p.flatMap(x => [x, x]), xRangeMax + 1];

  // Update sources with new x-values
  source_p.data['x'] = x_p;
  source_c.data['x'] = x_c;

  // Obtain parameter values
  let params = paramsFromSliders(sliders);

  // Update the PMF and CDF
  source_p.data['y_p'] = dist.pmf(x_p, params);
  source_c.data['y_c'] = dist.cdfForPlotting(x_c[0], x_c[x_c.length - 1], params);

  source_p.change.emit();
  source_c.change.emit();
}

function updateData(source_p, source_c, p_p, sliders, discrete) {
  if (discrete) {
    updateDiscretePMFandCDF(source_p, source_c, p_p.x_range, sliders);
  }
  else {
    updateContinuousPDFandCDF(source_p, source_c, p_p.x_range, sliders);
  }
}

function updateQuantiles(quantileSetterSwitch, sliders, xBoxes, pBoxes) {
  if (!quantileSetterSwitch.active) {
    let params = paramsFromSliders(sliders);

    for (let i = 0; i < xBoxes.length; i++) {
      xBoxes[i].value = dist.ppfSingleValue(Number(pBoxes[i].value), params).toPrecision(4);
    }
  }
}


function quantileSetter(xBoxes, pBoxes, quantileSetterDiv, sliders, startBoxes, endBoxes, p_p, p_c, source_p) {
  // Shut off the triggering of callbacks
  triggerCallbacks.active = false;

  // Extract quantiles and desired targets
  let inputOk;
  try {
    var x = paramsFromBoxes(xBoxes);
    var p = paramsFromBoxes(pBoxes);

    // Obtain parameter values
    var params = paramsFromSliders(sliders);

    // Make sure the input is ok.
    inputOk = checkQuantileInput(x, p, dist.hardMin, dist.hardMax, dist.varName, quantileSetterDiv);
  } catch (e) {
    quantileSetterDiv.text = '<p style="color:tomato;">' + e.message; + '</p>';
    inputOk = false;
  }

  if (inputOk) {
    // Extra parameters to be passed into quantileSet
    let extraParams = [];
    for (let i = 0; i < dist.paramNames.length; i++) {
      if (dist.fixedParamsInds.includes(i)) {
        extraParams.push(params[i]);
      }
    }

    // Error text in the event of failure
    let errText = '<p style="color:tomato;">Failed to find parameters to match quantiles.</p>';

    // Obtain parameter values to match quantiles
    let optimParams, optimSuccess;
    try {
      [optimParams, optimSuccess] = dist.quantileSet(x, p, extraParams);
    } catch(e) {
      optimSuccess = false;
      errText = '<p style="color:tomato;">' + e.message; + '</p>';
    }

    let text;
    if (optimSuccess) {
      // Update text
      text = '<p>';
      for (let i = 0; i < optimParams.length - 1; i++) {
        text += dist.paramNames[dist.activeParamsInds[i]] + ' = ' + optimParams[i].toPrecision(4) + ', ';
      }
      let i = optimParams.length - 1;
      text += dist.paramNames[dist.activeParamsInds[i]] + ' = ' + optimParams[i].toPrecision(4) + '</p>';
    } else{
      text = errText;
    }

    quantileSetterDiv.text = text;

    if (optimSuccess) {
      // Build optimal parameter values
      let params = [];
      let aInd = 0;
      for (let i = 0; i < sliders.length; i++) {
        if (dist.activeParamsInds.includes(i)) {
          params.push(optimParams[aInd]);

          // Set slider value
          sliders[i].value = optimParams[aInd];

          aInd += 1;
        } else { // Slider is fixed
          params.push(sliders[i].value);
        }
      }

      // Update slider ranges to put parameter values in middle.
      for (let i = 0; i < optimParams.length; i++ ) {
        if (sliders[dist.activeParamsInds[i]].start > optimParams[i] || sliders[dist.activeParamsInds[i]].end < optimParams[i]) {
          // Set location parameter or parameter that can take neg. values range 95% of ppf range
          if (dist.locationParamInd === dist.activeParamsInds[i] || dist.paramMin[dist.activeParamsInds[i]] < 0) {
            let width = (dist.ppf(0.975, params) - dist.ppf(0.025, params)) / 2;
            startBoxes[dist.activeParamsInds[i]].value = (optimParams[i] - width).toPrecision(4);
            endBoxes[dist.activeParamsInds[i]].value = (optimParams[i] + width).toPrecision(4);
          } else {
            startBoxes[dist.activeParamsInds[i]].value = (4 * optimParams[i] / 1001).toPrecision(4);
            endBoxes[dist.activeParamsInds[i]].value = (4 * optimParams[i]).toPrecision(4);
          }
        }
        // Set slider range
        sliders[dist.activeParamsInds[i]].start = Number(startBoxes[dist.activeParamsInds[i]].value);
        sliders[dist.activeParamsInds[i]].end = Number(endBoxes[dist.activeParamsInds[i]].value);
      }

      // Obtain limits of x-axis
      let [x1, x2] = dist.defaultXRange(params);

      p_p.x_range.start = x1;
      p_p.x_range.end = x2;

      // Recompute PDF/PMF and CDF
      updateData(source_p, source_c, p_p, sliders, discrete);

      // Set y-ranges to the defaults
      setYRanges(p_p, p_c, source_p);  
    }
  }

  // Turn quantile trigger back on in case slider moves
  triggerCallbacks.active = true;  
}