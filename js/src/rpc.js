import Jupyter from 'base/js/namespace'

function biyamRpc (mod, fn, args, output) {
  const sessionId = Jupyter.notebook.kernel.session_id

  Jupyter.notebook.kernel.send_shell_message('biyam', {
    caller: sessionId,
    mod,
    fn,
    args
  })

  return new Promise((resolve, reject) => {
    Jupyter.notebook.kernel.register_iopub_handler('biyam',
      msg => {
        if (msg.content.caller === sessionId) {
          if (msg.content.type === 'result') {
            try {
              if (msg.content.ok) {
                resolve(msg.content.ret)
              } else {
                reject(new Error('Failed to run'))
              }
            } finally {
              Jupyter.notebook.kernel.register_iopub_handler('biyam', () => null)
            }
          } else if (msg.content.type === 'output') {
            output && output(msg.content.output)
          }
        }
      })
  })
}

export default biyamRpc
