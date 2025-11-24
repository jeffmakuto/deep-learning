# Image Classification with CNN

Deep learning project implementing a Convolutional Neural Network (CNN) for image classification on the CIFAR-10 dataset.

## Project Overview

This project demonstrates a complete deep learning pipeline for multi-class image classification:
- **Dataset:** CIFAR-10 (60,000 32×32 color images in 10 classes)
- **Model:** Custom CNN with 3 convolutional blocks and dense layers
- **Performance:** Expected 80-85% test accuracy
- **Framework:** TensorFlow/Keras

## CIFAR-10 Classes

The model classifies images into 10 categories:
1. ✈️ Airplane
2. 🚗 Automobile  
3. 🐦 Bird
4. 🐱 Cat
5. 🦌 Deer
6. 🐕 Dog
7. 🐸 Frog
8. 🐴 Horse
9. 🚢 Ship
10. 🚚 Truck

## Quick Start

### 1. Install Dependencies

```powershell
# Activate virtual environment (from repository root)
.\.venv\Scripts\Activate.ps1

# Install required packages
pip install tensorflow-cpu==2.15.0 keras==2.15.0
pip install matplotlib seaborn scikit-learn
```

### 2. Run the Notebook

Open `cifar10_cnn.ipynb` in VS Code or Jupyter and execute all cells to:
- Load and preprocess CIFAR-10 data
- Build and train the CNN model
- Evaluate performance with comprehensive metrics
- Generate visualizations and reports

### 3. Review Results

After execution, check the `output/` directory for:
- Training history plots
- Confusion matrix
- Per-class accuracy analysis
- Sample predictions
- Metrics JSON file

## Project Structure

```
image_classification/
├── cifar10_cnn.ipynb           # Main notebook with full pipeline
├── PROJECT_REPORT.md           # Detailed technical report
├── README.md                   # This file
├── models/                     # Saved models
│   ├── best_model.keras       # Best validation accuracy
│   └── final_model.keras      # Final trained model
└── output/                     # Results and visualizations
    ├── sample_images.png
    ├── training_history.png
    ├── confusion_matrix.png
    ├── per_class_accuracy.png
    ├── correct_predictions.png
    ├── incorrect_predictions.png
    ├── metrics.json
    └── classification_report.txt
```

## Model Architecture

**3-Block CNN Design:**
- **Block 1:** 2×Conv2D(64) + BatchNorm + MaxPool + Dropout(0.25)
- **Block 2:** 2×Conv2D(128) + BatchNorm + MaxPool + Dropout(0.25)
- **Block 3:** 2×Conv2D(256) + BatchNorm + MaxPool + Dropout(0.25)
- **Classifier:** Dense(512) → Dense(256) → Dense(10, softmax)

**Key Features:**
- Batch normalization for training stability
- Dropout for regularization
- L2 regularization on dense layers
- Progressive filter increase (64→128→256)

**Parameters:** ~2.3 million trainable parameters

## Training Configuration

| Parameter | Value |
|-----------|-------|
| Optimizer | Adam with exponential decay |
| Initial LR | 0.001 |
| Batch Size | 64 |
| Max Epochs | 50 |
| Early Stopping | Patience = 15 |
| Validation Split | 10% (5,000 images) |

## Performance Metrics

The notebook generates comprehensive evaluation metrics:

### Accuracy Metrics
- Overall test accuracy
- Per-class accuracy breakdown
- Confusion matrix analysis

### Classification Metrics
- Precision (weighted average)
- Recall (weighted average)
- F1-score (weighted average)
- Detailed classification report

### Visualizations
- Training/validation accuracy curves
- Training/validation loss curves
- Confusion matrix heatmap
- Per-class accuracy bar chart
- Correct prediction samples
- Incorrect prediction analysis

## Expected Results

Based on the architecture and hyperparameters:
- **Test Accuracy:** 80-85%
- **Best Classes:** ship, truck, airplane (85-90%)
- **Challenging Classes:** cat, dog (70-75% due to visual similarity)
- **Training Time:** 40-60 minutes on CPU, 10-15 minutes on GPU

## Key Challenges and Solutions

### Challenge 1: Overfitting
**Solution:** Triple regularization approach
- Dropout layers (0.25 in conv, 0.5 in dense)
- Batch normalization
- L2 weight regularization (0.001)

### Challenge 2: Cat vs. Dog Confusion
**Solution:** Increased model capacity in later blocks
- More filters in block 3 (256 filters)
- Additional dense layer (512→256→10)

### Challenge 3: Learning Rate Tuning
**Solution:** Multi-strategy adaptive approach
- Exponential decay schedule
- ReduceLROnPlateau callback
- Early stopping

See `PROJECT_REPORT.md` for detailed analysis of all challenges and solutions.

## Future Improvements

### Potential Enhancements
1. **Data Augmentation** (+3-4% accuracy)
   - Random flips, rotations, zoom
   - Color jittering
   
2. **Deeper Architecture** (+5-7% accuracy)
   - ResNet-style skip connections
   - 20-30 layer network
   
3. **Transfer Learning** (+8-10% accuracy)
   - Pretrained ImageNet features
   - Fine-tuning approach
   
4. **Ensemble Methods** (+2-3% accuracy)
   - Multiple model averaging
   - Different architectures

## Detailed Documentation

For comprehensive information, see:
- **`PROJECT_REPORT.md`** - Full technical report with:
  - Architecture rationale
  - Hyperparameter tuning process
  - Challenge solutions and insights
  - Performance analysis
  - Future research directions

## Requirements

```
tensorflow-cpu==2.15.0
keras==2.15.0
numpy>=1.24.0
pandas>=2.0.0
matplotlib>=3.7.0
seaborn>=0.12.0
scikit-learn>=1.3.0
```

## Usage Example

```python
# Load the trained model
from tensorflow import keras

model = keras.models.load_model('models/best_model.keras')

# Make predictions on new images
predictions = model.predict(new_images)
predicted_classes = np.argmax(predictions, axis=1)

# Get class names
class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer',
               'dog', 'frog', 'horse', 'ship', 'truck']
predicted_labels = [class_names[i] for i in predicted_classes]
```

## License

This project follows the repository's main LICENSE file.

## Contributing

This is an educational project demonstrating CNN classification. Feel free to:
- Experiment with different architectures
- Implement suggested improvements
- Add data augmentation
- Try transfer learning approaches

## Acknowledgments

- **Dataset:** CIFAR-10 by Alex Krizhevsky
- **Framework:** TensorFlow/Keras team
- **Inspiration:** Classic CNN architectures (VGG, ResNet)
