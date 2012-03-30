# Copyright 2012 Dina Betser.
# Network Stickies main script for 6.170 Assignment #4.

#import jinja_wrapper
import stickies_model

import hashlib
import os
import shelve
import sys

from flask import Flask, render_template, redirect, url_for, flash, request, session, g
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
    db = shelve.open(app.config['DATABASE'])
    username = db['id_name_map'][int(id)]
    user = db['userinfo_map'][username]
    db.close()
    return user


login_manager.setup_app(app)


def reset_db():
    '''Initialize/reset the database.'''
    db = shelve.open(app.config['DATABASE'])
    db['userinfo_map'] = {"Dina": stickies_model.User(u"Dina", 1, hash_pwd('a'))}
    db['id_name_map'] = {1: "Dina"}
    db['stickies_for_userid'] = {}
    db['current_userid'] = 0
    db.close()


# Whenever a user connects, we load the database.
@app.before_request
def before_request():
    g.db = shelve.open(app.config['DATABASE'])

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
        print g.db
        assert ('username' in request.form and 'password' in request.form
                and request.form['username'] not in g.db['id_name_map'].values())
        cur_id = g.db.get('current_userid')
        print cur_id
        g.db['id_name_map'][cur_id] = request.form['username']
        user = stickies_model.User(
            request.form['username'],
            g.db['current_userid'],
            hash_pwd(request.form['password']))
        g.db['userinfo_map'][request.form['username']] = user
        g.db['current_userid'] += 1
        remember = request.form.get('remember', 'no') == 'yes'
        if login_user(user, remember=remember):
            flash('Logged in!')
            return redirect(request.args.get('next') or url_for('index'))
        else:
            flash('Sorry, but you could not log in.')
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    print "logiin"
    if request.method == 'POST' and 'username' in request.form:
        username = request.form['username']
        print username, g.db['id_name_map'], session
        print username in g.db['id_name_map'].values()
        # Check if username exists.
        if username in g.db['id_name_map'].values():
            # Ensure that password matches expected password.
            user = g.db['userinfo_map'].get(username)
            print "user", user.pw_hash, "form", hash_pwd(request.form['password'])
            print hash_pwd(request.form['password']) == user.pw_hash
            if hash_pwd(request.form['password']) == user.pw_hash:
                remember = request.form.get('remember', 'no') == 'yes'
                if login_user(user, remember=remember):
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
    logout_user()
    flash('Logged out.')
    return redirect(url_for('index'))


if __name__ == '__main__':
  # Parse command-line args.
  if len(sys.argv) < 3:
    print ('Correct usage: stickies.py <input_filename> <output_filename>')
  else:
    input_filename = sys.argv[1]
    output_filename = sys.argv[2]
    #wrapper = jinja_wrapper.JinjaWrapper(input_filename, output_filename)  ## TODO use wrapper to output html.

    app.run(debug=True)
