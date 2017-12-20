import importlib
import traceback
import typing
import io
import sys
import enum
import json
import inspect
from IPython.display import display, DisplayHandle

class Biyam:
    @staticmethod
    def _native_to_biyam_type(tp: typing.Type) -> typing.Any:
        if tp is bool:
            return 'Check'
        elif tp in (int, float):
            return 'Number'
        elif tp is str:
            return 'String'
        return None

    @staticmethod
    def procedure(ret_type: typing.Optional[typing.Type]=None,
                  args: typing.Dict[str, typing.Any]=(),
                  inline: typing.Optional[bool]=None,
                  no_func: bool=False,
                  no_proc: bool=False)\
            -> typing.Callable[[typing.Callable], typing.Callable]:
        def decorator(fn: typing.Callable) -> typing.Callable:
            meta: typing.Dict[str, typing.Any] = {}
            no_func_ = no_func
            ret_type_ = ret_type

            if ret_type is None:
                if 'return' in fn.__annotations__:
                    if fn.__annotations__['return'] is None:
                        no_func_ = True
                    ret_type_ = fn.__annotations__['return']

            if ret_type_ is not None:
                rtp = Biyam._native_to_biyam_type(ret_type_)
                if rtp is not None:
                    meta['ret_type'] = rtp

            meta['args'] = []
            for param in inspect.signature(fn).parameters:
                spec = {'name': param}
                tp_ = fn.__annotations__.get(param, None)
                if param in fn.__annotations__ and tp_:
                    spec['type'] = Biyam._native_to_biyam_type(tp_)
                meta['args'].append(spec)

            for name, tp in args.items():
                for spec in meta['args']:
                    if spec['name'] == name:
                        if isinstance(tp, type):
                            spec['type'] = Biyam._native_to_biyam_type(tp)
                        elif isinstance(tp, typing.Iterable) and not isinstance(tp, str):
                            spec['type'] = {i: i for i in tp}
                        else:
                            spec['type'] = tp
                        break

            if inline is not None:
                meta['inline'] = inline
            meta['no_func'] = no_func_
            meta['no_proc'] = no_proc

            setattr(fn, '_biyam_meta_', meta)
            return fn

        return decorator

    @staticmethod
    def _gather_procedures(mod_name: str) -> typing.Dict[str, typing.Any]:
        mod = importlib.import_module(mod_name)

        return {
                k: getattr(v, '_biyam_meta_')
                for k in dir(mod) if not k.startswith('_')
                for v in (getattr(mod, k, None),)
                if hasattr(v, '_biyam_meta_') and hasattr(v, '__call__')
        }

    def __init__(self, *mods: str) -> None:
        self._info = {
            'procedures': {
                mod: Biyam._gather_procedures(mod)
                for mod in mods
            }
        }

    def _ipython_display_(self, **kwargs: typing.Any)\
            -> typing.Optional[DisplayHandle]:
        return display({
            'text/plain': "Biyam Workspace",
            'application/x.biyam.workspace': '',
        }, metadata=self._info, raw=True, **kwargs)
