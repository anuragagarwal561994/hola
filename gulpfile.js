"use strict";

const gulp = require('gulp');
const browserify = require('browserify');
const minifyCSS = require('gulp-minify-css');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const purify = require('gulp-purifycss');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const ngAnnotate = require('gulp-ng-annotate');
const babelify  = require('babelify');
const htmlmin = require('gulp-htmlmin');

/**
 * Browserifies JavaScript for distribution
 */
gulp.task('scripts', () => {

  gulp.src('semantic/dist/semantic.min.js')
    .pipe(gulp.dest('./dist/js'));

  browserify('src/js/renderer.js')
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .pipe(source('renderer.js'))
    .pipe(buffer())
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));

  browserify('src/js/custom.js')
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .pipe(source('custom.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
});

/**
 * Combines and minifies CSS
 */
gulp.task('css', () => {
  gulp.src([
    'src/css/themify-icons.css',
    'src/css/*.css'
  ])
  .pipe(minifyCSS({keepSpecialComments : 0, processImport: false}))
  .pipe(concat('style.min.css'))
  .pipe(gulp.dest('./dist/css'));
});

/**
 * For fonts
 */
gulp.task('fonts', () => {
  gulp.src('src/fonts/*')
    .pipe(gulp.dest('./dist/fonts'));
});

/**
 * Copies images from src to dist
 */
gulp.task('images', () => {
  gulp.src('src/images/*')
    .pipe(gulp.dest('./dist/images'));
});

/**
 * Copies views from src to dist
 */
gulp.task('views', () => {
  gulp.src('src/views/*')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./dist/views'));

  gulp.src('index.html')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', () => {
  gulp.start('default');
  gulp.watch('src/js/*.js', ['scripts']);
  gulp.watch('src/views/*.html', ['views']);
  gulp.watch('index.html', ['views']);
  gulp.watch('src/css/*.css', ['css']);
  gulp.watch('src/images/*', ['images']);
  gulp.watch('src/fonts/*', ['fonts']);
})

/**
 * Gulp default task for running other tasks
 */
gulp.task('default', ['scripts', 'views', 'css', 'images', 'fonts'],  () => {
  console.log("Building project!");
});
