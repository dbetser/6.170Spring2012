# Copyright 2012 Dina Betser.
# Network Stickies main script for 6.170 Assignment #4.
import os
import shelve

from flask import Flask, request
from flaskext.login import LoginManager
from jinja2 import Environment
from jinja2 import FileSystemLoader

# Configuration.
DATABASE = 'db/stickies_database.db'

# Create the Flask application.
app = Flask(__name__)
app.config.from_object(__name__)
app.debug = True
app.secret_key = 'secretkey'

def reset_db():
    """Initialize/reset the database."""
    db = shelve.open(app.config['DATABASE'])
    db['num_visitors']=0 # TODO fix
    db.close()


@app.route('/index.html')
@app.route('/')
def hello_world():
    return "Hello World! I'm a flask example."


if __name__ == '__main__':
    app.run()
