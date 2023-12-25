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
      let qStr = '<p style="color:tomato;">Must have ' + xMin.toString() + ' ≤ yy ≤' + xMax.toString() + '.</p\>';
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