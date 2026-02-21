from flask import Flask

app = Flask(__name__)

# Define a route for the root URL
@app.route('/')
def hello_world():
    return 'Hello, World'


@app.route('/dashboard')
def dashboard():
    return 'Dashboard Page'


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
