import pyparsing

discrete_dists = [
    "bernoulli",
    "binomial",
    "categorical",
    "discrete_uniform",
    "geometric",
    "hypergeometric",
    "negative_binomial",
    "negative_binomial_mu_phi",
    "negative_binomial_r_b",
    "poisson",
]

continuous_dists = [
    "beta",
    "cauchy",
    "exponential",
    "gamma",
    "inverse_gamma",
    "halfcauchy",
    "halfnormal",
    "halfstudent_t",
    "lognormal",
    "normal",
    "pareto",
    "student_t",
    "uniform",
    "weibull",
]

extra_funs = {
    "bernoulli": [],
    "beta_binomial": ["lnbeta", "lnchoice", "lnfactorial", "lngamma"],
    "binomial": ["lnchoice", "lnfactorial"],
    "categorical": [],
    "discrete_uniform": [],
    "geometric": [],
    "hypergeometric": ["lnchoice", "lnfactorial"],
    "negative_binomial": ["lngamma", "lnfactorial"],
    "negative_binomial_mu_phi": ["lngamma", "lnfactorial"],
    "negative_binomial_r_b": ["lngamma", "lnfactorial"],
    "poisson": ["lnfactorial"],
    "beta": [
        "lngamma",
        "lnbeta",
        "regularized_incomplete_beta",
        "betacf",
        "log1p",
        "isone",
        "iszero",
    ],
    "cauchy": [],
    "exponential": [],
    "gamma": ["lngamma", "gammainc_u", "gammainc_l"],
    "halfcauchy": [],
    "halfnormal": ["erf"],
    "halfstudent_t": ["lngamma", "log1p", "regularized_incomplete_beta", "betacf"],
    "inverse_gamma": ["lngamma", "gammainc_u", "gammainc_l"],
    "lognormal": ["erf"],
    "normal": ["erf"],
    "pareto": [],
    "student_t": ["lngamma", "log1p", "regularized_incomplete_beta", "betacf"],
    "uniform": [],
    "weibull": [],
}


def read_js_code(fname, cut_comments=True, cut_exports=True):
    out_strs = []
    within_comment = False
    with open(fname, "r") as f:
        for line in f:
            if not (cut_exports and 'exports' in line):
                out_strs.append(line)

    out = ''.join(out_strs)

    if cut_comments:
        comment_parser = pyparsing.nestedExpr("/*", "*/").suppress()
        out = comment_parser.transformString(out)

    return out


def read_js_codes():
    discrete_callback = read_js_code("discrete_callback_code.js")
    continuous_callback = read_js_code("continuous_callback_code.js")
    quantile_setter_callback = read_js_code("quantile_setter_callback_code.js")
    utils = read_js_code("utility_functions.js")
    discrete_code = read_js_code("discrete_dists.js")
    continuous_code = read_js_code("continuous_dists.js")
    quantile_setter_code = read_js_code("quantile_setter_dists.js")
    matrix_code = read_js_code("matrix.js")
    root_finding_code = read_js_code("root_finding.js")

    return (
        discrete_callback,
        continuous_callback,
        quantile_setter_callback,
        utils,
        discrete_code,
        continuous_code,
        quantile_setter_code,
        matrix_code,
        root_finding_code,
    )


def write_slider_start_stop_callbacks():
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write(
            '''start = """
    slider.start = Math.max(min_value, Number(cb_obj.value));
    slider.step = (slider.end - slider.start) / 1000;
"""

end = """
slider.end = Math.min(max_value, Number(cb_obj.value));
slider.step = (slider.end - slider.start) / 1000;
"""

start_int = """
slider.start = Math.max(Math.floor(min_value), Math.floor(Number(cb_obj.value)));
"""

end_int = """
slider.end = Math.min(Math.floor(max_value), Math.floor(Number(cb_obj.value)));
"""

'''
        )


def write_parameter_mode_callbacks():
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write(
            '''vary_parameters = """
    if (cb_obj.active === 0) {
        quantile_setter_button.active = null;
        for (let i = 0; i < sliders.length; i++) {
            sliders[i].disabled = false;
        }
        quantile_setter_div.text = '';
        x1_box.disabled = true;
        p1_box.disabled = true;
        x2_box.disabled = true;
        p2_box.disabled = true;
    }
"""

quantile_setter = """
    if (cb_obj.active === 0) {
        vary_parameters_button.active = null;
        for (let i = 0; i < sliders.length; i++) {
            sliders[i].disabled = true;
        }
        x1_box.disabled = false;
        p1_box.disabled = false;
        x2_box.disabled = false;
        p2_box.disabled = false;
    }
"""

'''
        )


def extract_fun(file_str, fun_name, new_fun_name=None):
    start_ind = file_str.find("function " + fun_name)
    end_ind = file_str[start_ind + 1 :].find("\nfunction ")

    if end_ind == -1:
        end_ind = len(file_str)
    else:
        end_ind += start_ind - 1

    fun_str = file_str[start_ind:end_ind].rstrip() + "\n\n"

    if new_fun_name is not None:
        fun_str = fun_str.replace(fun_name, new_fun_name, 1)

    return fun_str


def write_discrete_utils(f):
    f.write(extract_fun(utils, "arange"))
    f.write(extract_fun(utils, "discrete_cdf"))
    f.write(extract_fun(utils, "update_y_p"))
    f.write(extract_fun(utils, "update_y_c_discrete"))


def write_continuous_utils(f):
    f.write(extract_fun(utils, "linspace"))
    f.write(extract_fun(utils, "update_y_p"))
    f.write(extract_fun(utils, "update_y_c_continuous"))


def write_discrete(dist):
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write(f'{dist}_callback = """')

        write_discrete_utils(f)

        for extra in extra_funs[dist]:
            f.write(extract_fun(utils, extra))
            f.write("\n\n")

        f.write(extract_fun(discrete_code, f"{dist}_prob", "probFun"))

        f.write(discrete_callback)
        f.write('\n"""\n\n')


def write_continuous(dist):
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write(f'{dist}_callback = """')

        write_continuous_utils(f)

        for extra in extra_funs[dist]:
            f.write(extract_fun(utils, extra))
            f.write("\n\n")

        f.write(extract_fun(continuous_code, f"{dist}_prob", "probFun"))
        f.write(extract_fun(continuous_code, f"{dist}_cdf", "cdfFun"))

        f.write(continuous_callback)
        f.write('\n"""\n\n')


def write_dict():
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write("callbacks = {\n")
        for dist in discrete_dists:
            f.write('\t"' + dist + '": ' + dist + "_callback,\n")
        for dist in continuous_dists:
            f.write('\t"' + dist + '": ' + dist + "_callback,\n")
        f.write("}\n\n")


def write_warning():
    with open("../distribution_explorer/callbacks.py", "w") as f:
        f.write(
            "# THIS FILE IS AUTOGENERATED BY generate_callbacks.py. DO NOT EDIT.\n\n"
        )


def write_quantile_setter(dist):
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write(f'{dist}_quantile_setter_callback = """')

        if dist not in ["exponential", "uniform"]:
            f.write(matrix_code)
            f.write("\n\n")

            f.write(root_finding_code)

            # for fun in ['jacCentralDiff', 'findRootTrustRegion', 'computeRho', 'checkTol', 'doglegStep']:
            #     f.write(extract_fun(root_finding_code, fun))
            #     f.write("\n\n")

        for extra in extra_funs[dist]:
            f.write(extract_fun(utils, extra))
            f.write("\n\n")

        f.write(extract_fun(continuous_code, f"{dist}_cdf"))

        f.write(extract_fun(quantile_setter_code, "checkQuantileInput"))

        f.write(
            extract_fun(
                quantile_setter_code,
                f"{dist}_quantile_setter",
                "quantile_setter_callback",
            )
        )

        f.write(quantile_setter_callback)
        f.write('\n"""\n\n')


def write_quantile_setter_dict():
    with open("../distribution_explorer/callbacks.py", "a") as f:
        f.write("quantile_setter_callbacks = {\n")
        for dist in continuous_dists:
            f.write('\t"' + dist + '": ' + dist + "_quantile_setter_callback,\n")

        f.write("}\n\n")


if __name__ == "__main__":
    (
        discrete_callback,
        continuous_callback,
        quantile_setter_callback,
        utils,
        discrete_code,
        continuous_code,
        quantile_setter_code,
        matrix_code,
        root_finding_code,
    ) = read_js_codes()

    write_warning()
    write_slider_start_stop_callbacks()
    write_parameter_mode_callbacks()

    for dist in discrete_dists:
        write_discrete(dist)

    for dist in continuous_dists:
        write_continuous(dist)

    for dist in continuous_dists:
        write_quantile_setter(dist)

    write_dict()
    write_quantile_setter_dict()
