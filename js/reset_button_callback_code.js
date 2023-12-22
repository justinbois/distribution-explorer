/**
 * Set the y-ranges for PDF and CDF plots.
 */
function set_y_ranges(p_p, p_c, source_p) {
	p_c.y_range.start = -0.04;
	p_c.y_range.end = 1.04;        

	let pdfMax = source_p.data['y_p'];
	p_p.y_range.start = -pdfMax * 0.04;
	p_p.y_range.end = 1.04 * pdfMax;
}

reset_button_callback(p_p, p_c, source_p, arg1.value, arg2.value, arg3.value);