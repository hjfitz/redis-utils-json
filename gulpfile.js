// eslint-ignore
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const jsdoc = require('gulp-jsdoc3');

const jsdocConfig = require('./jsdoc.config.json');

const tsProj = ts.createProject('tsconfig.json');

gulp.task('build', () => gulp
  .src('lib/**/*.ts')
  .pipe(sourcemaps.init())
  .pipe(tsProj())
  .pipe(babel())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('dist')));

gulp.task('docs', cb => gulp
  .src(['./dist/*.js'])
  .pipe(jsdoc(jsdocConfig, cb)));


gulp.task('watch', () => gulp.watch(['./lib/**/*.ts'], ['build']));

gulp.task('precommit', []);

gulp.task('default', ['build', 'docs']);
