const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');

const tsProj = ts.createProject('tsconfig.json');

gulp.task('build', () => {
  gulp.src('lib/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsProj())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});
