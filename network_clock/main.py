from datetime import datetime
import shelve
from flask import Flask, render_template, jsonify, request, session, g

#create the Flask application
app = Flask(__name__)
app.config.from_object(__name__)
app.debug = True
app.secret_key = 'this key is used to sign the session cookies'

#Returns a string representing the current time
def current_time_string():
    now = datetime.now()
    return now.strftime("%b %d, %Y, %I:%M:%S %p")


###########################
#                         #   
#  Your code can go here  #
#                         #
###########################









if __name__ == '__main__':
    app.run()
