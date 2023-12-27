// The code below assumes that dist is an instance of a 
// ContinuousUnivariateDistribution class or of a
// DiscreteUnivariateDistribution and that all necessary
// functions and classes have been loaded.

if (quantileSetterSwitch.active) {
  // Extract quantiles and desired targets
  let x = paramsFromBoxes(xBoxes);
  let p = paramsFromBoxes(pBoxes);

  // Obtain parameter values
  let params = paramsFromSliders(sliders);

  // Make sure the input is ok.
  let inputOk = checkQuantileInput(x, p, dist.hardMin, dist.hardMax, dist.varName, quantileSetterDiv);

  if (inputOk) {
    // Extra parameters to be passed into quantileSet
    let extraParams = [];
    for (let i = 0; i < dist.paramNames.length; i++) {
      if (dist.fixedParamsInds.includes(i)) {
        extraParams.push(params[i]);
      }
    }

    // Obtain parameter values to match quantiles
    let [optimParams, optimSuccess] = dist.quantileSet(x, p, extraParams);

    let text;
    if (optimSuccess) {
      // Update text
      text = '<p>';
      for (let i = 0; i < optimParams.length - 1; i++) {
        text += sliders[dist.activeParamsInds[i]].title + ' = ' + optimParams[i].toPrecision(4) + ', ';
      }
      let i = optimParams.length - 1;
      text += sliders[dist.activeParamsInds[i]].title + ' = ' + optimParams[i].toPrecision(4) + '</p>';
    } else{
      text = '<p style="color:tomato;">Failed to find parameters to match quantiles.</p>';
    }

    quantileSetterDiv.text = text;

    if (optimSuccess) {
      // Update slider ranges to put parameter values in middle.
      for (let i = 0; i < optimParams.length; i++ ){
        if (sliders[dist.activeParamsInds[i]].start > optimParams[i] || sliders[dist.activeParamsInds[i]].end < optimParams[i]) {
          startBoxes[dist.activeParamsInds[i]].value = (4 * optimParams[i] / 1001).toPrecision(4);
          endBoxes[dist.activeParamsInds[i]].value = (4 * optimParams[i]).toPrecision(4);        
        }
        sliders[dist.activeParamsInds[i]].value = optimParams[i];
      }

      // Reset the view so the PDF/CDF are clearly displayed.
      // re-obtain parameter values
      params = paramsFromSliders(sliders); 

      // Obtain limits of x-axis
      let [x1, x2] = dist.defaultXRange(params);

      // Set the new x_range. This will trigger recalculation of PDF/PMF and CDF
      // via the callback linked to the x_range.
      p_p.x_range.start = x1;
      p_p.x_range.end = x2;

      // Set y-ranges to the defaults
      setYRanges(p_p, p_c, source_p);  
    }
  }
}