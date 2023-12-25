// Args for this callback is a list of sliders, a list of x-boxes for quantile setting,
// and a list of p-boxes for quantile setting. cb_obj is the quantile setting activation
// switch.

if (cb_obj.active) {
  for (let i = 0; i < sliders.length; i++) {
      sliders[i].disabled = true;
  }
  for (let xBox of xBoxes) {
    xBox.disabled = false;
  }
  for (let pBox of pBoxes) {
    pBox.disabled = false;
  }
} else {
  for (let i = 0; i < sliders.length; i++) {
      sliders[i].disabled = false;
  }
  for (let xBox of xBoxes) {
    xBox.disabled = true;
  }
  for (let pBox of pBoxes) {
    pBox.disabled = true;
  }
  quantileSetterDiv.text = '';
}