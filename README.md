# Deep Learning Examples and Small Projects

This repository is a collection of small, self-contained deep learning and ML example projects, notebooks, and utility scripts used for experimentation and teaching.

Top-level scripts and folders

- `examples/california_housing.py` — Keras/TensorFlow example that builds and trains a "wide & deep" model on the scikit-learn California Housing dataset. Demonstrates: data splitting, scaling, functional API models, multi-output training, TensorBoard logging, and a small subclassed model example.
- `examples/train_fashion_mnist.py` — Simple TensorFlow/Keras script that trains a classifier on the Fashion MNIST dataset. Useful as a quick demo of preprocessing, model definition (Sequential API), training, evaluation, and predictions.
- `requirements.txt` — Core Python package requirements for the top-level examples (TensorFlow CPU build, Keras, scikit-learn, pandas, matplotlib). See per-subproject requirements for more specific deps.
- `customer_segmentation/` — End-to-end customer segmentation workflow built around a Kaggle supermarket transactions dataset. Includes helpers, a notebook (`notebooks/segmentation_analysis.ipynb`), exported HTML report, and an analysis README.
- `decision_trees/` — Notebook and exported HTML demonstrating decision tree ensemble methods and workflows.
- `linear_regression/` — A small linear regression demo notebook and exported HTML.
- `neural_networks/` — MNIST handwritten digit recognition using CNN. Demonstrates deep learning for computer vision.
- `image_classification/` — CIFAR-10 image classification using deep CNN. Complete project with training, evaluation, comprehensive metrics, and detailed performance report. Achieves 87% test accuracy.
- `my_logs/` — Example TensorBoard run logs created by `examples/california_housing.py` when training with callbacks.

Quick start (Windows PowerShell)

1. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install top-level requirements (for the example scripts):

```powershell
python -m pip install -r requirements.txt
```

3. Run a demo script directly from PowerShell:

Train Fashion MNIST (quick):

```powershell
python .\examples\train_fashion_mnist.py
```

Train the California Housing example (creates TensorBoard logs in `my_logs/`):

```powershell
python .\examples\california_housing.py
```

4. View notebooks and HTML exports

- Many notebooks have exported HTML versions in the corresponding folders (for quick viewing in a browser):
	- `customer_segmentation/segmentation_analysis.html`
	- `decision_trees/ensemble_workflow.html`
	- `linear_regression/linear_regression_demo.html`

Repository notes and structure

- Notebooks: Use a Python environment that satisfies the requirements for a given folder (see `customer_segmentation/requirements.txt` for that project). Open the notebook in VS Code or Jupyter and run cells interactively.
- Data: Large datasets are not stored in this repo. The `customer_segmentation` notebook expects a local copy of the Kaggle dataset (see `customer_segmentation/README.md` for the expected cache path or how to change it).
- Logs: Example TensorBoard logs are under `my_logs/` — you can point TensorBoard to a run directory to inspect training metrics.

Contributing and license

Feel free to open issues or pull requests. Each folder may contain its own LICENSE; check folder-level LICENSE files (for example in `decision_trees/` and `linear_regression/`).

If you'd like, I can additionally:

- Add a `CONTRIBUTING.md` with reproduction steps and coding style.
- Add small runnable helpers that wrap the notebooks into a CLI.

See the per-project READMEs for more details.

