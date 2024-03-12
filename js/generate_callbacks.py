import json
import pyparsing
import re


def _read_js_code(fname, cut_comments=True, cut_exports=True):
    """Read in a JS file into a string, possibly cutting comments and
    export statements."""
    out_strs = []
    within_comment = False
    with open(fname, "r") as f:
        for line in f:
            if not (cut_exports and "exports" in line):
                out_strs.append(line)

    out = "".join(out_strs)

    if cut_comments:
        # First, the /* */ style comments
        comment_parser = pyparsing.nestedExpr("/*", "*/").suppress()
        out = comment_parser.transformString(out)

        # And also remove // style comments.
        out = re.sub(r"//.*?\n", "\n", out)

    return out


def _extract_function(jstext, fun_name, new_fun_name=None):
    """Extract a function from JS code."""
    start_ind = jstext.find("function " + fun_name)

    # Initialize list of open {
    open_braces = 1
    end_ind = start_ind + jstext[start_ind:].find("{") + 1
    while end_ind < len(jstext) and open_braces > 0:
        if jstext[end_ind] == "}":
            open_braces -= 1
        elif jstext[end_ind] == "{":
            open_braces += 1

        end_ind += 1

    fun_str = jstext[start_ind:end_ind].rstrip() + "\n\n"

    if new_fun_name is not None:
        fun_str = fun_str.replace(fun_name, new_fun_name, 1)

    return fun_str


def _extract_class(jstext, classname):
    """Extract a class from JS code."""
    start_ind = jstext.find(f"class {classname}")
    if start_ind == -1:
        raise RuntimeError(f"Could not find class {classname}.")

    # Read until first open brace
    i = start_ind + jstext[start_ind:].find("{") + 1

    # Read until open brace is closed
    nopen = 1
    while i < len(jstext) and nopen > 0:
        if jstext[i] == "{":
            nopen += 1
        elif jstext[i] == "}":
            nopen -= 1
        i += 1

    if i == len(jstext):
        raise RuntimeError("Failed to find end of class definition.")

    return jstext[start_ind : i + 1]


def _callback_class_and_function_dicts():
    """Read in all pertinent JS classes and functions and make
    dictionary where each key is a function or class and each value is
    a string containing the JS corresponding code."""
    output_dict = {}

    # Read in code for probability distribution classes
    code = _read_js_code("prob_dists.js")

    # Find all class names
    classes = re.findall(r"class\s+(\w+)", code)

    # Store all classes in a dictionary
    for class_name in classes:
        output_dict[class_name] = _extract_class(code, class_name)

    # Now all functions from all pertinent files
    for filename in (
        "utils_math.js",
        "utils_linalg.js",
        "utils_interactive_plotting.js",
        "root_finding.js",
    ):
        code = _read_js_code(filename)
        functions = re.findall(r"function\s+(\w+)", code)
        for fun in functions:
            output_dict[fun] = _extract_function(code, fun)

    # Now all of the callbacks for specific widgets
    for fname in [
        "slider_start_callback",
        "slider_end_callback",
        "int_slider_start_callback",
        "int_slider_end_callback",
        "quantile_setter_switch_callback",
        "quantile_setter_callback",
        "reset_button_callback",
        "slider_callback",
        "xaxis_change_callback",
    ]:
        output_dict[fname] = _read_js_code(f"{fname}.js")

    return output_dict


def _dependencies(code_dict):
    """Take a dictionary of JS classes and functions. For each class or
    function, make a list of classes and functions on which they depend.
    The result is a dictionary where the keys are function/class names
    and each value is a list containing the functions or classes that
    the key is dependent upon.
    """
    # First pass
    output = {}
    for f in code_dict:
        output[f] = []
        for g in code_dict:
            if g + "(" in code_dict[f] and g != f:
                output[f].append(g)

    # A manual one: Trust region uses jacCentralDiff
    output["findRootTrustRegion"].append("jacCentralDiff")

    # Another manual one, the superclasses for different parametrizations of
    # the Negative Binomial
    output["NegativeBinomialMuPhiDistribution"].append('NegativeBinomialDistribution')
    output["NegativeBinomialRBDistribution"].append('NegativeBinomialDistribution')

    # Another manual one, the superclasses for different parametrizations of
    # the Beta
    output["BetaPhiKappaDistribution"].append('BetaDistribution')

    # Add in super classes for distributions
    for f, code in code_dict.items():
        if "extends UnivariateDistribution" in code:
            output[f].append("UnivariateDistribution")
        elif "extends ContinuousUnivariateDistribution" in code:
            output[f] += ["UnivariateDistribution", "ContinuousUnivariateDistribution"]
        elif "extends DiscreteUnivariateDistribution" in code:
            output[f] += ["UnivariateDistribution", "DiscreteUnivariateDistribution"]

    # Keep going through until nothing is added
    n_added = 1
    while n_added > 0:
        n_added = 0
        for f in code_dict:
            for g in output[f]:
                for h in output[g]:
                    if h not in output[f]:
                        output[f].append(h)
                        n_added += 1

    # For each set of dependencies, make sure superclass, especially
    # UnivariateDistribution and/or ContinuousUnivariateDistribution and/or
    # DiscreteUnivariateDistribution are first
    for f in output:
        # Special case where NegativeBinomial is a superclass
        if 'NegativeBinomialDistribution' in output[f]:
            output[f].insert(
                0, output[f].pop(output[f].index('NegativeBinomialDistribution'))
            )
        if "DiscreteUnivariateDistribution" in output[f]:
            output[f].insert(
                0, output[f].pop(output[f].index("DiscreteUnivariateDistribution"))
            )
        if "ContinuousUnivariateDistribution" in output[f]:
            output[f].insert(
                0, output[f].pop(output[f].index("ContinuousUnivariateDistribution"))
            )
        if "UnivariateDistribution" in output[f]:
            output[f].insert(
                0, output[f].pop(output[f].index("UnivariateDistribution"))
            )

    return output


def write_callbacks(callback_fname, code_dict):
    """Manually writing better than using JSON for readability."""
    code_str = "_callbacks = {\n"

    # Add JS functions
    for fun, code in code_dict.items():
        code_str += '    "' + fun + '": """\n'
        code_str += code
        code_str += '""",\n'
    code_str += "}"

    # Clean up superfluous newlines (created by deleting comments)
    code_str = re.sub(r"(^\s*$\n){3,}", "\n", code_str, flags=re.MULTILINE)

    # Dependencies
    code_str += "\n\n_dependencies = {\n"
    deps = _dependencies(code_dict)

    for fun, depends in deps.items():
        code_str += '    "' + fun + '": ' + str(depends) + ",\n"
    code_str += "}"

    with open(callback_fname, "w") as f:
        f.write("# THIS FILE IS AUTOGENERATED. DO NOT EDIT.\n\n")
        f.write(code_str)


if __name__ == "__main__":
    code_dict = _callback_class_and_function_dicts()
    write_callbacks("../distribution_explorer/callbacks.py", code_dict)
