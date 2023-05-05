import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import csso from 'postcss-csso';
import del from 'del';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import terser from 'gulp-terser';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';

// Clean
const clean = () => {
  return del('build');
};


// Copy
const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}',
    'source/*.ico',
    'source/*.webmanifest',
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'))
  done();
}


const html = () => {
  return gulp.src('source/*.html')
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest('build'));
}


// Styles
export const styles = () => {
  return gulp.src('source/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    // для тестирования сборки из папки source
    // .pipe(gulp.dest('source/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}


// Scripts
const scripts = () => {
  return gulp.src('source/js/main.js')
  .pipe(terser())
  .pipe(rename('main.min.js'))
  .pipe(gulp.dest('build/js'));
}

// SVG
const svg = () =>
  gulp.src(['source/image/**/*.svg', '!source/image/icons/*.svg'])
    .pipe(svgo())
    .pipe(gulp.dest('build/image'));

const sprite = () => {
  return gulp.src('source/image/icons/*.svg')
    .pipe(svgo())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/image'));
}

// Images

const optimizeImages = () => {
  return gulp.src('source/image/**/*.{png,jpg}')
    .pipe(squoosh())
    .pipe(gulp.dest('build/image'))
}

const copyImages = () => {
  return gulp.src('source/image/**/*.{png,jpg}')
    .pipe(gulp.dest('build/image'))
}

// WebP

const createWebp = () => {
  return gulp.src('source/image/**/*.{png,jpg}')
    .pipe(squoosh({
      webp: {}
    }))
    .pipe(gulp.dest('build/image'))
}

// Server
const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
      // для тестирования сборки из папки source
      // baseDir: 'source'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}


// Watcher
const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/*.html').on('change', browser.reload);
  gulp.watch('source/js/*.js', gulp.series(scripts));
}

// Build

export const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svg,
    sprite,
    createWebp,
  ),
);

// Default

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svg,
    sprite,
    createWebp,
  ),
  gulp.series(
    server,
    watcher
));
