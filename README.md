# &#x1f40d; Biyam

Blockly on Jupyter Notebook w/ Python

## Installation

```bash
pip install biyam
```

For developers,

```bash
git clone https://github.com/gwangyi/biyam
cd biyam
pip install -e .
```

### Known issues

If you are using python 3.x as default python interpreter, `node-gyp` may fail
to build libxmljs. In that case, building JS first w/ python 2.x and build
package w/ your python interpreter.

```bash
cd js
pyenv shell system  # Use system python interpreter
npm install
npx gulp build
pyenv shell --unset  # Restore python interpreter
cd ..
pip install -e .
```

## Example

Save as test.py:

```python
from biyam import biyam_procedure


@bIyam_procedure(no_func=True, args={'title': ['Mr.', 'Ms.', 'Dr.']})
def hello(title: str, name: str) -> None:
    print("Hello,", title, name)
```

On notebook:

```
%load_ext biyam
```

```
%%biyam
test
```

Following lines after `%%biyam` are the full name of modules which contain callables decorated by `biyam_procedure`.
