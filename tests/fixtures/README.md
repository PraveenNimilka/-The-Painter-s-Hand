# Golden inputs

`portrait.jpg` is Matplotlib's locally installed `mpl-data/sample_data/grace_hopper.jpg` portrait of Grace Hopper, copied without alteration. It is included for reproducible comparisons rather than loaded from a third-party service. `low-contrast.jpg` applies Pillow's contrast factor 0.3 to that image. `clutter.jpg` adds border stripe strokes. `white.png` and `silhouette.png` were generated procedurally for this project.

The manually marked diagnostic feature centers in source pixels are stored in `tests/results/quality.json`. The fixture transformations and SSIM calculation are explained in `scripts/evaluate.py`. Python evaluation needs Pillow, NumPy and SciPy; core/browser tests run with the JavaScript dev dependencies.
