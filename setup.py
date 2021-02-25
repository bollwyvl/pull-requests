"""setup for jupyterlab_pullrequests with JupyterLab federated extension"""
import setuptools
from pathlib import Path
import json

HERE = Path(__file__).parent
ETC_DEST = "etc/jupyter"
NAME = "jupyterlab_pullrequests"
EXT = HERE / NAME / "labextension"
PKG = json.loads((EXT / "package.json").read_text(encoding="utf-8"))

DATA_FILES = []

# serverextension
DATA_FILES += [
    (f"{ETC_DEST}/jupyter_{app}_config.d", [f"etc/jupyterlab-pull-requests-{app}.json"])
    for app in ["server", "notebook"]
]


setup_args = dict(
    name=NAME,
    version=PKG["version"],
    author=PKG["author"],
    license=PKG["license"],
    description=PKG["description"],
    long_description=(HERE / "README.md").read_text(encoding="utf-8"),
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(".", exclude=["tests*"]),
    python_requires=">=3.6",
    install_requires=[
        "jupyterlab >=3",
        # TODO: replace when real
        "nbdime >=3.0.0b1"
    ],
    extras_require={
        "test": [
            "pytest",
            "asynctest"
        ]
    },
    include_package_data=True,
    data_files=DATA_FILES,
    zip_safe=False,
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
