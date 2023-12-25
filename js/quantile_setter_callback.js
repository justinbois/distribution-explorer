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
  let inputOk = checkQuantileInput(x, p, dist.xMin(params), dist.xMax(params), dist.varName, quantileSetterDiv);

  if (inputOk) {
    // Obtain parameter values to match quantiles
    let [optimParams, optimSuccess] = dist.quantileSet(x, p);

    let text;
    if (optimSuccess) {
      // Update text
      text = '<p>';
      for (let i = 0; i < optimParams.length - 1; i++) {
        text += sliders[i].title + ' = ' + optimParams[i].toPrecision(4) + ', ';
      }
      let i = optimParams.length - 1;
      text += sliders[i].title + ' = ' + optimParams[i].toPrecision(4) + '</p>';
    } else{
      text = '<p style="color:tomato;">Failed to find parameters to match quantiles.</p>';
    }

    quantileSetterDiv.text = text;

    if (optimSuccess) {
      // Update slider ranges to put parameter values in middle.
      for (let i = 0; i < optimParams.length; i++ ){
        if (sliders[i].start > optimParams[i] || sliders[i].end < optimParams[i]) {
          startBoxes[i].value = (4 * optimParams[i] / 1001).toPrecision(4);
          endBoxes[i].value = (4 * optimParams[i]).toPrecision(4);        
        }
        sliders[i].value = optimParams[i];
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