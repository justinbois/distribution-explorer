discrete_dists = [
    "bernoulli",
    "binomial",
    "categorical",
    "discrete_uniform",
    "geometric",
    "hypergeometric",
    "negative_binomial",
    "negative_binomial_mu_phi",
    "poisson",
]

continuous_dists = [
    "beta",
    "cauchy",
    "exponential",
    "gamma",
    "inverse_gamma",
    "lognormal",
    "normal",
    "pareto",
    "student_t",
    "uniform",
    "weibull",
]


def read_js_codes():
    with open("discrete_callback_code.js", "r") as f:
        discrete_callback = f.read()

    with open("continuous_callback_code.js", "r") as f:
        continuous_callback = f.read()

    with open("utility_functions.js", "r") as f:
        utils = f.read()

    with open("discrete_dists.js", "r") as f:
        discrete_code = f.read()

    with open("continuous_dists.js", "r") as f:
        continuous_code = f.read()

    return (
        discrete_callback,
        continuous_callback,
        utils,
        discrete_code,
        continuous_code,
    )


def write_slider_start_stop_callbacks():
    with open("../distribution_explorer/callbacks.py", "w") as f:
        f.write(
            '''start = """
    slider.start = Math.max(min_value, Number(cb_obj.value));
"""

end = """
slider.end = Math.min(max_value, Number(cb_obj.value));
"""

start_int = """
slider.start = Math.max(1, Math.floor(Number(cb_obj.value)));
"""

end_int = """
slider.end = Math.floor(Number(cb_obj.value));
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
        "poisson": ["lnfactorial"],
    }

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
    extra_funs = {
        "beta": ["lngamma", "lnbeta", "regularized_incomplete_beta", "betacf", "log1p"],
        "cauchy": [],
        "exponential": [],
        "gamma": ["lngamma", "gammainc_u", "gammainc_l"],
        "inverse_gamma": ["lngamma", "gammainc_u", "gammainc_l"],
        "lognormal": ["erf"],
        "normal": ["erf"],
        "pareto": [],
        "student_t": ["lngamma", "log1p", "regularized_incomplete_beta", "betacf"],
        "uniform": [],
        "weibull": [],
    }

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


if __name__ == "__main__":
    discrete_callback, continuous_callback, utils, discrete_code, continuous_code = (
        read_js_codes()
    )
    write_slider_start_stop_callbacks()

    for dist in discrete_dists:
        write_discrete(dist)

    for dist in continuous_dists:
        write_continuous(dist)

    write_dict()
