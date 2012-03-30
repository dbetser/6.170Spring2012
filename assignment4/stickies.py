# Copyright 2012 Dina Betser.
# Network Stickies main script for 6.170 Assignment #4.

#import jinja_wrapper
import stickies_model

import hashlib
import os
import shelve
import sys

from flask import (Flask, render_template, redirect, url_for, flash, request,
                   jsonify, session, g)
from flaskext.login import (LoginManager, current_user, login_required,
                            login_user, logout_user,
                            confirm_login, fresh_login_required)

# Configuration.
DATABASE = 'db/stickies_database.db'

# Create the Flask application.
app = Flask(__name__)
app.config.from_object(__name__)
app.debug = True
app.secret_key = 'secretkey'


login_manager = LoginManager()

login_manager.anonymous_user = stickies_model.Anonymous
login_manager.login_view = 'login'
login_manager.login_message = u'Please log in to access this page.'
login_manager.refresh_view = 'reauth'

@login_manager.user_loader
def load_user(id):
    db = shelve.open(app.config['DATABASE'], writeback=True)
    username = db['id_name_map'].get(int(id))
    user = db['userinfo_map'].get(username)
    db.close()
    return user


login_manager.setup_app(app)


def reset_db():
    '''Initialize/reset the database.'''
    db = shelve.open(app.config['DATABASE'])
    db['userinfo_map'] = {}
    db['id_name_map'] = {}
    db['stickies_for_username'] = {}
    db['current_userid'] = 0
    db['current_stickyid'] = 0
    db.close()


# Whenever a user connects, we load the database.
@app.before_request
def before_request():
    g.db = shelve.open(app.config['DATABASE'], writeback=True)

# Close the database connection at the end of each request.
@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()

@app.route('/index.html')
@app.route('/')
def index():
    return render_template('stickies_main.html', sticky_objects=[])


def hash_pwd(password):
    '''Returns the hash of the password.'''
    return hashlib.sha224(password).hexdigest()

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        assert 'username' in request.form and 'password' in request.form
        if request.form['username'] in g.db['id_name_map'].values():
            flash('Username already exists. Please pick another username.')
            return False
        else:
            cur_id = g.db.get('current_userid')
            g.db['id_name_map'][cur_id] = request.form['username']
            user = stickies_model.User(
                request.form['username'],
                g.db['current_userid'],
                hash_pwd(request.form['password']))
            g.db['userinfo_map'][request.form['username']] = user
            g.db['current_userid'] += 1
            return True
#             remember = request.form.get('remember', 'no') == 'yes'
#             if login_user(user, remember=remember):
#                 session['username'] = user.name
#                 print current_user.is_authenticated(), user.is_authenticated()
#                 flash('Logged in!')
#                 return redirect(request.args.get('next') or url_for('index'))
#             else:
#                 flash('Sorry, but you could not register.')
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    print "logiin"
    if request.method == 'POST' and 'username' in request.form:
        username = request.form['username']
        # Check if username exists.
        if username in g.db['id_name_map'].values():
            # Ensure that password matches expected password.
            user = g.db['userinfo_map'].get(username)
            print "user", user.pw_hash, "form", hash_pwd(request.form['password'])
            print hash_pwd(request.form['password']) == user.pw_hash
            if hash_pwd(request.form['password']) == user.pw_hash:
                remember = request.form.get('remember', 'no') == 'yes'
                if login_user(user, remember=remember):
                    session['username'] = user.name
                    flash('Logged in!')
                    return redirect(request.args.get('next') or url_for('index'))
                else:
                    flash('Sorry, but you could not log in.')
            else:
                flash('Sorry, but you provided an incorrect password.')
        else:
            flash(u'Invalid username.')
    return render_template('login.html')


@app.route('/reauth', methods=['GET', 'POST'])
@login_required
def reauth():
    if request.method == 'POST':
        confirm_login()
        flash(u'Reauthenticated.')
        return redirect(request.args.get('next') or url_for('index'))
    return render_template('reauth.html')


@app.route('/logout')
@login_required
def logout():
    session['username'] = 'anonymous'
    logout_user()
    flash('Logged out.')
    return redirect(url_for('index'))

def get_serialized_stickies_for_user(username):
 return jsonify(
     sticky_objects=[
         x.serialize for x in g.db['stickies_for_username'].get(username)])

@app.route('/add_sticky', methods=["POST"])
@login_required
def add_sticky(text_content, position):
    user = g.db['userinfo_map'].get(session['username'])
    new_sticky = stickies_model.StickyNote(
        user,
        stickies_model.Position(position['x'], position['y'], position['z']),
        stickies_model.TextContent(text_content),
        g.db['userinfo_map'].get('current_stickyid')
    )
    g.db['userinfo_map']['current_stickyid'] += 1
    if g.db['stickies_for_username'].get(session['username']) is None:
        g.db['stickies_for_username'][session['username']] = [new_sticky]
    else:
        g.db['stickies_for_username'].get(session['username']).append(new_sticky)
    print g.db['stickies_for_username'].get(session['username'])
    return get_serialized_stickies_for_user(session['username'])


if __name__ == '__main__':
  # Parse command-line args.
  if len(sys.argv) < 3:
    print ('Correct usage: stickies.py <input_filename> <output_filename>')
  else:
    input_filename = sys.argv[1]
    output_filename = sys.argv[2]
    #wrapper = jinja_wrapper.JinjaWrapper(input_filename, output_filename)  ## TODO use wrapper to output html.

    app.run(debug=True)
