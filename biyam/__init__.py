from .biyam import *
from .rpcmanager import BiyamRpcManager
from IPython.core.magic import register_cell_magic, register_line_magic
import typing
import re


def _jupyter_nbextension_paths() -> typing.List[typing.Dict[str, str]]:
    return [dict(
        section="notebook",
        src="static",
        dest="biyam",
        require="biyam/main")]


def _js(line: str, cell: str) -> None:
    display({'application/x.biyam.javascript': cell}, raw=True)


def _biyam(line: str, cell: str) -> None:
    display(Biyam(*re.split(r'\s+', cell)))


def load_ipython_extension(ipython: typing.Any) -> None:
    if ipython:
        ipython.register_magic_function(_js, 'cell', 'javascript_biyam')
        ipython.register_magic_function(_biyam, 'cell', 'biyam')

        if ipython.kernel:
            BiyamRpcManager('biyam', ipython)


biyam_procedure = Biyam.procedure
