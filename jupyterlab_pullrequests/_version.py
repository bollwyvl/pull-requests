"""version information for jupyterlab_pullrequests"""
from pathlib import Path
import json

HERE = Path(__file__).parent
PKG = (HERE / "labextension/package.json")

__js__ = json.loads(PKG.read_text(encoding="utf-8"))

__version__ = __js__["version"]

__all__ = ["__version__", "__js__"]
