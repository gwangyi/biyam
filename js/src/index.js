'use strict'

import Jupyter from 'base/js/namespace'
import outputarea from 'notebook/js/outputarea'

import modalPrompt from './modal'
import Runner from './runner'

import { MIME_BIYAM, MIME_BIYAM_JS } from './mime'

import { registerMimeType } from './view'

import biyamRpc from './rpc'

function appendBiyamJs (json, md, element) {
  const r = new Runner(json)
  const outputArea = this

  r.on('output', (md, msg) => {
    if (msg === null) {
      outputArea.clear_output()
    } else {
      outputArea.append_output(msg)
    }
  })

  r.on('prompt', (e, args) => modalPrompt(args.msg, args.callback))

  try {
    r.step()
  } catch (err) {
    console.error(err)
    outputArea.append_output({ output_type: 'stream', name: 'stderr', text: '' + err })
  }
}

function loadIPythonExtension () {
  Jupyter.CodeCell.options_default.highlight_modes.magic_javascript.reg.push('^%%javascript_biyam')
  outputarea.OutputArea.prototype.register_mime_type(MIME_BIYAM_JS, appendBiyamJs, { safe: false, index: 0 })
  registerMimeType()

  for (const cell of Jupyter.notebook.get_cells()) {
    const rerender = cell.output_area &&
      cell.output_area.outputs.find(output => output.data && output.data[MIME_BIYAM] !== undefined)
    if (rerender) { Jupyter.notebook.render_cell_output(cell) }
  }
}

export { loadIPythonExtension as load_ipython_extension, biyamRpc } // eslint-disable-line camelcase
