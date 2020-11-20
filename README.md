# &#x1f40d; Biyam

Blockly on Jupyter Notebook w/ Python

## Installation

```bash
pip install biyam
jupyter nbextension install --py biyam
jupyter nbextension enable --py biyam
```

For developers,

```bash
git clone https://github.com/gwangyi/biyam
cd biyam
pip install -e .
cd js
yarn
yarn gulp
jupyter nbextension install --py biyam
jupyter nbextension enable --py biyam
```

## Example

Save as test.py:

```python
from biyam import biyam_procedure


@biyam_procedure(no_func=True, args={'title': ['Mr.', 'Ms.', 'Dr.']})
def hello(title: str, name: str) -> None:
    print("Hello,", title, name)
```

On notebook:

```
import sys
sys.path.append(PATH_TO_TEST_PY)
```

```
%load_ext biyam
```

```
%%biyam
test
```

Following lines after `%%biyam` are the full name of modules which contain callables decorated by `biyam_procedure`.
