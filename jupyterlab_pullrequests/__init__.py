""""Pull Requests for JupyterLab"""

from ._version import __version__, __js__

__all__ = ["__version__", "__js__"]


def _jupyter_server_extension_paths():
    return [{"module": "jupyterlab_pullrequests.handlers"}]


def _jupyter_labextension_paths():
    return [
        {
            "src": "labextension",
            "dest": "@jupyterlab/pull-requests",
        }
    ]
