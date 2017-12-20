import io
import typing
import importlib
import sys
import traceback
from zmq.eventloop.zmqstream import ZMQStream
from IPython.core.interactiveshell import InteractiveShell
from IPython.core.displaypub import CapturingDisplayPublisher
from IPython.core.displayhook import CapturingDisplayHook
from ipykernel.ipkernel import IPythonKernel


class _CommWriter:
    def __init__(self, kernel: IPythonKernel, caller: str) -> None:
        self._kernel = kernel
        self._caller = caller

    def _send(self, **msg: typing.Any) -> None:
        self._kernel.session.send(self._kernel.iopub_socket, 'biyam', msg)

    def output(self, name: str, text: str) -> None:
        self._send(caller=self._caller,
                   type='output',
                   output={
                       'output_type': 'stream',
                       'name': name,
                       'text': text
                   })

    def resolve(self, ret: typing.Any) -> None:
        self._send(caller=self._caller,
                   type='result',
                   ok=True,
                   ret=ret)

    def reject(self) -> None:
        self._send(caller=self._caller,
                   type='result',
                   ok=False)


class _PseudoWriter(io.TextIOBase):
    def __init__(self, comm_writer: _CommWriter, name: str) -> None:
        self._comm_writer = comm_writer
        self._name = name

    def writable(self) -> bool:
        return True

    def write(self, message: str) -> int:
        self._comm_writer.output(self._name, message)
        return len(message)


class _DummyList(list):
    def __init__(self, comm_writer: _CommWriter) -> None:
        super().__init__()
        self._comm_writer = comm_writer

    def append(self, item: typing.Any) -> None:
        if isinstance(item, typing.Sequence):
            msg = {
                'output_type': 'display_data',
                'data': item[0],
                'metadata': item[1]
            }
        else:
            msg = item
        self._comm_writer.output(msg)


class BiyamRpcManager:
    def __init__(self, msg_type: str, ipy: InteractiveShell) -> None:
        ipy.kernel.shell_handlers[msg_type] = self._handle_biyam
        self._kernel = ipy.kernel
        self._shell = ipy

    def _handle_biyam(self, stream: ZMQStream, ident: typing.List[bytes], msg: typing.Dict[str, typing.Any]) -> None:
        content = msg.get('content')
        caller = content.get('caller', None)
        if caller is None:
            return

        comm = _CommWriter(self._kernel, caller)

        stdout_ = sys.stdout
        stderr_ = sys.stderr
        displayhook_ = sys.displayhook
        shell = self._shell
        display_pub_ = shell.display_pub if shell else None

        try:
            sys.stdout = typing.cast(typing.Any,
                                     _PseudoWriter(comm, 'stdout'))
            sys.stderr = typing.cast(typing.Any,
                                     _PseudoWriter(comm, 'stderr'))
            if shell:
                outputs = _DummyList(comm)
                shell.display_pub = CapturingDisplayPublisher()
                shell.display_pub.outputs = outputs
                sys.displayhook = CapturingDisplayHook(shell, outputs)

            mod_name = content.get('mod', '__main__')

            mod = importlib.import_module(mod_name)
            fn_ = getattr(mod, content.get('fn', 'main'))
            if not hasattr(fn_, '_biyam_meta_'):
                raise PermissionError(fn_.__name__ + ' is not exposed')
            ret = fn_(**content.get('args', {}))

            comm.resolve(ret)
        except Exception:
            traceback.print_exc()
            comm.reject()
        finally:
            sys.stdout = stdout_
            sys.stderr = stderr_
            sys.displayhook = displayhook_
            if shell:
                shell.display_pub = display_pub_
