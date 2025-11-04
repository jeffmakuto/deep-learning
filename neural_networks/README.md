# Handwritten Digit Recognition (MNIST)

This folder contains a small, self-contained example that trains a convolutional neural network (CNN) on the MNIST handwritten digits dataset.

Files

- `train_mnist.py` — Python script that loads MNIST, preprocesses the data, builds a small CNN, trains it, evaluates on the test set, and saves the model and training plots to `neural_networks/output/`.

Quick start (Windows PowerShell)

1. Create & activate a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies (top-level `requirements.txt` includes TensorFlow CPU in this repo; you can also install a GPU-enabled build if you prefer):

```powershell
python -m pip install -r requirements.txt
```

3. Run the training script (example):

```powershell
python .\neural_networks\train_mnist.py --epochs 5 --batch-size 64
```

What the script produces

- `neural_networks/output/mnist_cnn_model.h5` — the saved Keras model
- `neural_networks/output/accuracy.png` and `loss.png` — training plots
- `neural_networks/output/predictions_sample.json` — a small JSON file with sample predictions and ground truth

Notes

- The script is meant for learning and experimentation. For production workflows, add dataset caching, command-line controls for optimizer/learning rate, checkpointing, and more robust logging.
- If you want a lightweight MLP version instead of a CNN, I can add it as an alternate script or flag.
