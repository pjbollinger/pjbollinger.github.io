var gulp = require('gulp');
var browserSync = require('browser-sync').create();

// Copy third party libraries from /node_modules into /vendor
gulp.task('vendor', function(done) {

  // Bootstrap
  gulp.src([
      './node_modules/bootstrap/dist/**/*',
      '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
      '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
    ])
    .pipe(gulp.dest('./vendor/bootstrap'))

  // jQuery
  gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'))

  // FontAwesome CSS
  gulp.src([
    './node_modules/@fortawesome/fontawesome-free/css/*.min.css',
  ])
  .pipe(gulp.dest('./vendor/fontawesome/css'))
  // FontAwesome Webfonts
  gulp.src([
    './node_modules/@fortawesome/fontawesome-free/webfonts/*',
  ])
  .pipe(gulp.dest('./vendor/fontawesome/webfonts'))

  done();
});

// Default task
gulp.task('default', gulp.series('vendor'));

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
});

// Dev task
gulp.task('dev', gulp.series('browserSync', function() {
  gulp.watch('./css/*.css', browserSync.reload);
  gulp.watch('./*.html', browserSync.reload);
}));
