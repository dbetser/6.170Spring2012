from flask import Flask, request
from flaskext.login import LoginManager

import os
app = Flask(__name__)

@app.route('/index.html')
@app.route('/')
def hello_world():
    return "Hello World! I'm a flask example."

if __name__ == '__main__':
    app.run()
