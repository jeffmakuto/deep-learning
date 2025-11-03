# %% [markdown]
# # Train Fashion MNIST Model
# This file trains a model on the Fashion MNIST dataset.

# %%
import tensorflow as tf
import matplotlib.pyplot as plt

# %%
fashion_mnist = tf.keras.datasets.fashion_mnist # type: ignore
(x_train_images, y_train_labels), (x_test_images, y_test_labels) = fashion_mnist.load_data()

# %%
x_train_images.shape

# %%
x_valid_images, x_train_images = x_train_images[:5000] / 255.0, x_train_images[5000:] / 255.0
y_valid_labels, y_train_labels = y_train_labels[:5000], y_train_labels[5000:]

# %%
class_names = [
    "T-shirt/top", "Trouser", "Pullover",
    "Dress", "Coat", "Sandal", "Shirt",
    "Sneaker", "Bag", "Ankle boot"
]

class_names[y_train_labels[0]]

# %%
# Create step by step Model using Sequential API
model = tf.keras.Sequential() # type: ignore
model.add(tf.keras.layers.Flatten(input_shape=(28, 28))) # type: ignore
model.add(tf.keras.layers.Dense(128, activation='relu')) # type: ignore
model.add(tf.keras.layers.Dense(10, activation='softmax')) # type: ignore

# %%
# Create the Model using Sequential API
model = tf.keras.Sequential([ # type: ignore
    tf.keras.layers.Flatten(input_shape=(28, 28)), # type: ignore
    tf.keras.layers.Dense(128, activation='relu'), # type: ignore
    tf.keras.layers.Dense(10, activation='softmax') # type: ignore
])

# %%
model.summary()

# %%
model.layers

# %%
hidden1 = model.layers[1]

# %%
hidden1.get_weights()

# %%
weights, biases = hidden1.get_weights()

# %%
weights.shape

# %%
biases.shape

# %%
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

history = model.fit(x_train_images, y_train_labels, epochs=10,
                    validation_data=(x_valid_images, y_valid_labels))

# %%
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

pd.DataFrame(history.history).plot(figsize=(8, 5))
plt.grid(True)
plt.gca().set_ylim(0, 1) # set the vertical range to [0-1]
plt.show()

# %%
model.evaluate(x_train_images, y_train_labels)

# %%
x_test_images = x_test_images / 255.0
model.evaluate(x_test_images, y_test_labels)

# %%
print(x_test_images.shape, x_test_images.dtype)
print(y_test_labels.shape, y_test_labels[:10])

# %%
x_new = x_test_images[:5]
y_proba = model.predict(x_new)
y_proba.round(2)

# %%
y_pred = np.argmax(y_proba, axis=1)
print(y_pred)

# %%
y_new = y_test_labels[:5]
print(y_new)
