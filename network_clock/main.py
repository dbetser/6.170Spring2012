from datetime import datetime
import shelve
from flask import Flask, render_template, jsonify, request, session, g

DATABASE = 'db/database.db'

#create the Flask application
app = Flask(__name__)
app.config.from_object(__name__)
app.debug = True
app.secret_key = 'this key is used to sign the session cookies'

#we can initialize/reset our database with this function
def reset_db():
    db = shelve.open(app.config['DATABASE'])
    db['num_visitors'] = 0
    db.close()

#Returns a string representing the current time
def current_time_string():
    now = datetime.now()
    return now.strftime("%b %d, %Y, %I:%M:%S %p")

@app.before_request
def before_request():
    g.db = shelve.open(app.config['DATABASE'])
    if not 'num_visitor' in session:
        g.db['num_visitors'] += 1
        session['num_visitor'] = g.db['num_visitors']

#Close the database connection at the end of each request
@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()

@app.route('/')
def render():
    return render_template(
        'main_page.html',
        cur_time=current_time_string(),
        num_visitors=session['num_visitor']
    )

@app.route('/refresh', methods=["GET"])
def refresh():
    return jsonify(current_time=current_time_string())


if __name__ == '__main__':
    app.run(debug=True)
