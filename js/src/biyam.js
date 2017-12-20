'use strict'

import $ from 'jquery'
import Jupyter from 'base/js/namespace'
import outputarea from 'notebook/js/outputarea'
import Blockly from 'node-blockly/browser'

import Runner from './runner'
import {registerBiyamToolboxCategoryCallbacks} from './procedures'
import modalPrompt from './modal'
import lang from './lang'
import toolbox from './toolbox.xml'

const $toolbox = $(toolbox)

class Biyam {
  constructor (element, info) {
    const thisBiyam = this

    this.workspace = null

    const $element = $(element)
    this.$element = $element

    this.id = parseInt($element.data('biyam-id'))

    const toolboxDom = $(info.toolbox)[0] || $toolbox[0]
    const workspace = element.getElementsByClassName('biyam-workspace')[0]
    const parameters = info.parameters || {}
    const procedures = info.procedures || {}

    parameters.toolbox = toolboxDom

    this.procedure = procedures
    this._parameters = parameters
    this._ws_element = workspace
    this._info = info

    this.code = $(info.code || '<xml/>')[0]
    this._go_on = false

    const language = $element.find('div.biyam-lang')

    Object.entries(lang.names).map(([l, name]) => {
      return $('<li/>').append(
        $('<a href="#"/>').text(name)
          .click(() => {
            thisBiyam._setLocale(l)
            language.find('.dropdown-toggle span:first').text(name)
          }))
    }).forEach(li => li.appendTo(language.find('.dropdown-menu')))

    let currentLang = (navigator && (navigator.userLanguage || navigator.language)) || 'en'
    if (lang.names[currentLang] === undefined) {
      currentLang = 'en'
    }

    language.find('.dropdown-toggle span:first').text(lang.names[currentLang])
    language.find('li a[data-key="' + currentLang + '"]').click()

    $element.find('button.biyam-size-expand').click(() => {
      $(workspace).height($(workspace).height() + 120)
      Blockly.svgResize(thisBiyam.workspace)
    })

    $element.find('button.biyam-size-shrink').click(() => {
      if ($(workspace).height() > 480) {
        $(workspace).height($(workspace).height() - 120)
        Blockly.svgResize(thisBiyam.workspace)
      }
    })

    $element.find('button.biyam-code-python').click(() => {
      var newCell = Jupyter.notebook.insert_cell_below('code', $(Jupyter.notebook.get_cells()).index(thisBiyam._nbCell()))
      var prefix = $.map(Object.keys(procedures), mod => mod !== '__main__' ? 'import ' + mod : undefined)
      newCell.set_text(prefix.join('\n') + '\n\n' + Blockly.Python.workspaceToCode(thisBiyam.workspace))
    })

    $element.find('button.biyam-code-js').click(() => {
      var newCell = Jupyter.notebook.insert_cell_below('code', $(Jupyter.notebook.get_cells()).index(thisBiyam._nbCell()))
      newCell.set_text('%%javascript_biyam\n\n' + Blockly.JavaScript.workspaceToCode(thisBiyam.workspace))
    })

    $element.find('button.biyam-code-biyam').click(() => {
      thisBiyam._info.code = thisBiyam.codeText
    })

    function step (reset) {
      if (!thisBiyam._runner.running) {
        if (reset) {
          thisBiyam._runner.reset()
          thisBiyam._runner.running = true
        } else return
      }
      $element.trigger('biyam-busy', true)
      thisBiyam._runner.step()
    };

    $element.find('button.biyam-run-step').click(() => {
      thisBiyam._go_on = false
      step(true)
    })

    $element.find('button.biyam-run-run').click(() => {
      thisBiyam._go_on = true
      step(true)
    })

    $element.find('button.biyam-run-pause').click(() => {
      thisBiyam._go_on = false
    })

    $element.find('button.biyam-run-stop').click(() => {
      thisBiyam._runner.reset()
    })

    $element.on('biyam-busy', (e, busy) => {
      if (thisBiyam._go_on) {
        if (!thisBiyam._runner.running) { $element.find('button.biyam-run-step,button.biyam-run-run').prop('disabled', false) } else if (!busy) {
          setTimeout(step, 100)
        }
      } else { $element.find('button.biyam-run-step,button.biyam-run-run').prop('disabled', !!busy) }

      if (thisBiyam._runner.running) {
        $element.find('.biyam-run-indicator .fa').addClass('fa-spin')
      } else {
        $element.find('.biyam-run-indicator .fa').removeClass('fa-spin')
      }
    })

    this.output_area = new outputarea.OutputArea({
      selector: $element.find('.biyam-outputarea'),
      config: { data: { OutputArea: {} } },
      prompt_area: false,
      events: Jupyter.notebook.events,
      keyboard_manager: Jupyter.notebook.keyboard_manager
    })
    this._setLocale(currentLang)
    language.change()
  }

  _render () {
    var code = this.code
    var thisBiyam = this
    if (this.workspace) {
      this.workspace.removeChangeListener(this._handleOnChange)
      code = Blockly.Xml.workspaceToDom(this.workspace)
      this.workspace.dispose()
    }
    var $toolbox = $(this._parameters.toolbox).clone()
    var toolbox_ = this._parameters.toolbox
    $toolbox.html($toolbox.html().replace(/(^|[^%]){(\w+)}/g,
      (m, p1, p2) => {
        return p1 + Blockly.Msg[p2.toUpperCase()]
      }))

    var cats = Object.keys(this.procedure).length
    var i = 0
    if (cats > 0) {
      $toolbox.append($('<sep/>'))
      if (cats > 1) cats--

      for (let cat in this.procedure) {
        var category = this.procedure[cat]
        $toolbox.append($('<category/>').attr('name', cat)
          .attr('colour', category.colour || (i * 360 / cats))
          .attr('custom', 'BIYAM-' + i))
        i++
      }
    }
    this._parameters.toolbox = $toolbox[0]
    this.workspace = Blockly.inject(this._ws_element, this._parameters)
    this._runner = new Runner(this.workspace)
    this._parameters.toolbox = toolbox_

    Blockly.Xml.domToWorkspace(code, this.workspace)

    this.workspace.addChangeListener(this._handleOnChange.bind(this))
    registerBiyamToolboxCategoryCallbacks(this)

    var outputArea = this.output_area
    this._runner.on('output', (e, msg) => {
      if (msg === null) { outputArea.clear_output() } else { outputArea.append_output(msg) }
    })
    this._runner.on('reset', e => {
      outputArea.clear_output()
      thisBiyam.$element.trigger('biyam-busy', false)
    })
    this._runner.on('finished', (e, all) => {
      if (all) {
        thisBiyam._go_on = false
        setTimeout(() => thisBiyam.$element.trigger('biyam-busy', false), 1000)
      } else { thisBiyam.$element.trigger('biyam-busy', false) }
    })
    this._runner.on('prompt', (e, args) => {
      modalPrompt(args.msg, args.callback)
    })
    $('.blocklyWidgetDiv:not(.biyam)').addClass('biyam')
      .keypress(e => e.stopPropagation())
      .keyup(e => e.stopPropagation())
      .keydown(e => e.stopPropagation())
  }

  _handleOnChange (e) {
    if (e.type !== Blockly.Events.UI) {
      if (this._runner.running) {
        this._runner.reset()
      }
    }
  }

  _nbCell () {
    var elem = $(this.$element).closest('.code_cell')
    var cell = Jupyter.notebook.get_cells().find(cell => cell.element[0] === elem[0])
    return cell
  }

  _setLocale (lang) {
    const thisBiyam = this
    Promise.all([
      import('node-blockly/lib/i18n/' + lang),
      import('i18n/' + lang)
    ]).then(([locale, additional]) => {
      Blockly.setLocale(locale)
      var MSG = additional()
      for (let [key, msg] of Object.entries(MSG)) {
        Blockly.Msg[key.toUpperCase()] = msg
      }
      thisBiyam._render()
    })
  }

  get codeText () {
    var dom = Blockly.Xml.workspaceToDom(this.workspace)
    return Blockly.Xml.domToText(dom)
  }

  set codeText (code) {
    var dom = Blockly.Xml.textToDom(code)
    Blockly.Xml.domToWorkspace(dom, this.workspace)
  }
}

export default Biyam
