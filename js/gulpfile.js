'use strict';

var gulp = require('gulp');
var insert = require('gulp-insert');
var webpack = require('webpack-stream');
var git = require('gulp-git');

gulp.task('submodules', function(cb) {
  git.updateSubmodule({ args: '--init' }, cb);
});

gulp.task('i18n', gulp.parallel(['submodules'], function() {
  return gulp.src('blockly/demos/code/msg/*.js')
    .pipe(insert.wrap('module.exports = function() {', ' return MSG;}'))
    .pipe(gulp.dest('lib/i18n/'))
}));

gulp.task('interpreter', gulp.parallel(['submodules'], function() {
  return gulp.src('JS-Interpreter/interpreter.js')
    .pipe(insert.wrap('/* eslint-disable */\n\ndefine(["acorn"], function(acorn) {', 'return Interpreter;});'))
    .pipe(gulp.dest('lib/'))
}));

gulp.task('webpack', gulp.parallel(['i18n', 'interpreter'], function() {
  return gulp.src('src/index.js')
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest('../biyam/static'));
}));

gulp.task('build', gulp.parallel([
  'submodules',
  'i18n',
  'interpreter',
  'webpack'
]));
