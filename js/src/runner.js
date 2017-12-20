import $ from 'jquery'
import Blockly from 'node-blockly/browser'
import Interpreter from 'interpreter'
import biyamRpc from './rpc'

Blockly.JavaScript.addReservedWords('_highlightBlock')
Blockly.JavaScript.addReservedWords('_biyamRpc')

class Runner {
  constructor (workspaceOrCode) {
    this._ui = $('<div/>')
    if (typeof (workspaceOrCode) === 'string') {
      this._jscode = workspaceOrCode
      this._workspace = null
    } else {
      this._jscode = null
      this._workspace = workspaceOrCode
    }
    this._busy = false
    this.running = false
    this.reset()
  }

  _initApi (interpreter, scope) {
    const thisRunner = this

    // Add an API function for the alert() block, generated for "text_print" blocks.
    interpreter.setProperty(scope, 'alert',
      interpreter.createNativeFunction(function (text) {
        text = text ? text.toString() : ''
        thisRunner._ui.trigger('output', {output_type: 'stream', name: 'output', text: text + '\n'})
      }))

    // Add an API function for the prompt() block.
    var wrapper = function (text, callback) {
      var callback_ = function (ret) {
        thisRunner._busy = false
        thisRunner._ui.trigger('finished', false)
        callback(ret)
        setTimeout(thisRunner.step.bind(thisRunner), 0)
      }
      thisRunner._busy = true
      text = text ? text.toString() : ''
      thisRunner._ui.trigger('prompt', { msg: text, callback: callback_ })
    }
    interpreter.setProperty(scope, 'prompt',
      interpreter.createAsyncFunction(wrapper))

    // Add an API function for highlighting blocks.
    wrapper = function (id) {
      id = id ? id.toString() : ''
      return interpreter.createPrimitive(thisRunner._highlightBlock(id))
    }
    interpreter.setProperty(scope, '_highlightBlock',
      interpreter.createNativeFunction(wrapper))

    wrapper = function (mod, fn, args, callback) {
      mod = (mod || '').toString()
      fn = (fn || '').toString()
      let args_ = interpreter.pseudoToNative(args)

      thisRunner._busy = true
      biyamRpc(mod, fn, args_, output => thisRunner._ui.trigger('output', output)).then(ret => {
        callback(interpreter.nativeToPseudo(ret))
        thisRunner._busy = false
        thisRunner._ui.trigger('finished', false)

        if (thisRunner.running) {
          thisRunner.step()
        }
      }).catch(reason => console.error(reason))
    }
    interpreter.setProperty(scope, '_biyamRpc',
      interpreter.createAsyncFunction(wrapper))
  }

  _highlightBlock (id) {
    if (this._workspace) this._workspace.highlightBlock(id)
    this._highlight_pause = true
  }

  reset () {
    if (this._workspace) this._workspace.highlightBlock(null)
    this._highlight_pause = false
    this._busy = false
    this.running = false
    if (this.comm) { this.comm.close() }

    let prefix = Blockly.JavaScript.STATEMENT_PREFIX

    try {
      Blockly.JavaScript.STATEMENT_PREFIX = '_highlightBlock(%1);\n'
      let jscode = this._jscode || Blockly.JavaScript.workspaceToCode(this._workspace)

      this._interpreter = new Interpreter(jscode, (interpreter, scope) => this._initApi(interpreter, scope))
      this._ui.trigger('reset')
    } finally {
      Blockly.JavaScript.STATEMENT_PREFIX = prefix
    }
  }

  step () {
    if (this._interpreter === null) this.reset()
    this._highlight_pause = false
    do {
      try {
        var more = this._interpreter.step()
        this.running = true
      } finally {
        if (!more) {
          this._interpreter = null
          this.running = false
          this._ui.trigger('finished', true)
          if (this._workspace) this._workspace.highlightBlock(null)
        }
      }
    } while (more && !this._highlight_pause && !this._busy)
    if (more && !this._busy) { this._ui.trigger('finished', false) }
  }

  on (name, callback) {
    this._ui.on(name, callback)
  }

  off (name, callback) {
    this._ui.off(name, callback)
  }
}

export default Runner
