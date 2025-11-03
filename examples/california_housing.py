# %% Imports
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf

# %% Load dataset
housing = fetch_california_housing()
X, y = housing.data, housing.target

# %% Split data
x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
x_train, x_valid, y_train, y_valid = train_test_split(x_train, y_train, test_size=0.2, random_state=42)

# %% Scale features
scaler = StandardScaler()
x_train = scaler.fit_transform(x_train)
x_valid = scaler.transform(x_valid)
x_test = scaler.transform(x_test)

# %% Dynamic Wide & Deep split
n_features = x_train.shape[1]
n_wide = n_features // 2              # first half = wide input
n_deep = n_features - n_wide          # second half = deep input

x_train_A, x_train_B = x_train[:, :n_wide], x_train[:, n_wide:]
x_valid_A, x_valid_B = x_valid[:, :n_wide], x_valid[:, n_wide:]
x_test_A, x_test_B = x_test[:, :n_wide], x_test[:, n_wide:]
x_new_A, x_new_B = x_test_A[:3], x_test_B[:3]

# %% Build the model
input_A = tf.keras.layers.Input(shape=(n_wide,), name="wide")
input_B = tf.keras.layers.Input(shape=(n_deep,), name="deep")

hidden1 = tf.keras.layers.Dense(30, activation="relu")(input_B)
hidden2 = tf.keras.layers.Dense(30, activation="relu")(hidden1)
concat = tf.keras.layers.Concatenate()([input_A, hidden2])
output = tf.keras.layers.Dense(1, name="output")(concat)

model = tf.keras.models.Model(inputs=[input_A, input_B], outputs=output)

# %% Compile & train
model.compile(loss="mean_squared_error", optimizer='adam')
history = model.fit(
    (x_train_A, x_train_B), y_train,
    epochs=50,
    validation_data=((x_valid_A, x_valid_B), y_valid)
)

# %% Evaluate & predict
mse_test = model.evaluate((x_test_A, x_test_B), y_test)
y_pred = model.predict((x_new_A, x_new_B))

print("Test MSE:", mse_test)
print("Predictions for first 3 test samples:", y_pred)

# Handling multiple outputs (Auxilliary outputs)
# %%
output1 = tf.keras.layers.Dense(1, name="main_output")(concat)
output2 = tf.keras.layers.Dense(1, name="aux_output")(hidden2)

model = tf.keras.models.Model(inputs=[input_A, input_B], outputs=[output1, output2])

# %%
model.compile(loss=["mse", "mse"], loss_weights=[0.8, 0.2], optimizer="adam")
history = model.fit(
    (x_train_A, x_train_B), (y_train, y_train),
    epochs=50,
    validation_data=((x_valid_A, x_valid_B), (y_valid, y_valid))
)

# %%
total_loss, main_loss, aux_loss = model.evaluate([x_test_A, x_test_B], [y_test, y_test])

# %%
y_pred_main, y_pred_aux = model.predict([x_new_A, x_new_B])

# %%
print("Main predictions:", y_pred_main)
print("Auxiliary predictions:", y_pred_aux)


# Using Sub classing API to build dynamic models
# %%
class WideAndDeepModel(tf.keras.Model):
    def __init__(self, units=30, activation="relu", **kwargs):
        super().__init__(**kwargs)  # handles standard args (e.g., name)
        self.hidden1 = tf.keras.layers.Dense(units, activation=activation)
        self.hidden2 = tf.keras.layers.Dense(units, activation=activation)
        self.main_output = tf.keras.layers.Dense(1)
        self.aux_output = tf.keras.layers.Dense(1)

    def call(self, inputs):
        input_A, input_B = inputs
        hidden1 = self.hidden1(input_B)
        hidden2 = self.hidden2(hidden1)
        concat = tf.keras.layers.concatenate([input_A, hidden2])
        main_output = self.main_output(concat)
        aux_output = self.aux_output(hidden2)
        return main_output, aux_output

model = WideAndDeepModel()

# Root Log Directory for tensorboard
# %%
import os

root_log_dir = os.path.join(os.curdir, "my_logs")

def get_run_log_dir():
    import time
    run_id = time.strftime("run_%Y_%m_%d-%H_%M_%S")
    return os.path.join(root_log_dir, run_id)

run_log_dir = get_run_log_dir()

# %%
model.compile(loss=["mse", "mse"], loss_weights=[0.8, 0.2], optimizer="adam")
tensorboard_cb = tf.keras.callbacks.TensorBoard(run_log_dir)
history = model.fit(
    (x_train_A, x_train_B), (y_train, y_train),
    epochs=50,
    validation_data=((x_valid_A, x_valid_B), (y_valid, y_valid)),
    callbacks=[tensorboard_cb]
)

# %%
