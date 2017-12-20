'use strict'

import $ from 'jquery'
import outputarea from 'notebook/js/outputarea'

import Biyam from './biyam'
import { MIME_BIYAM } from './mime'

import view from './view.tpl.html'

import 'arrive'
import './main.css'

function appendBiyam (json, md, element) {
  const $view = $(view).appendTo(element)
  $view[0].md = md
  return $view
}

function _inject (elem) {
  return new Biyam(elem, elem.md)
}

function registerMimeType () {
  outputarea.OutputArea.prototype.register_mime_type(MIME_BIYAM, appendBiyam, { safe: false, index: 1 })
  $(document).arrive('div.biyam-view', _inject)
}

export { registerMimeType }
