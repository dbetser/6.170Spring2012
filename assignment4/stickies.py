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

# Configuration.
DATABASE = 'db/stickies_database.db'

# Create the Flask application.
app = Flask(__name__)
app.config.from_object(__name__)
app.debug = True
app.secret_key = 'secretkey'


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
    stickies = []
    if session.get('logged_in') != None:
        username = session.get('username')
        print g.db['stickies_for_username'].get(username)
        stickies = g.db['stickies_for_username'].get(username)
    return render_template('stickies_main.html', sticky_objects=stickies)

def hash_pwd(password):
    '''Returns the hash of the password.'''
    return hashlib.sha224(password).hexdigest()

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        assert 'username' in request.form and 'password' in request.form
        if request.form['username'] in g.db['id_name_map'].values():
            flash('Username already exists. Please pick another username.')
        else:
            cur_id = g.db.get('current_userid')
            g.db['id_name_map'][cur_id] = request.form['username']
            user = stickies_model.User(
                request.form['username'],
                g.db['current_userid'],
                hash_pwd(request.form['password']))
            g.db['stickies_for_username'][request.form['username']] = []
            g.db['userinfo_map'][request.form['username']] = user
            g.db['current_userid'] += 1
            return login_user(user.name)
    return render_template('register.html')

def login_user(uname):
    '''Utility function to actually log in the user.'''
    session['logged_in'] = True
    session['username'] = uname
    flash('You were logged in!')
    return redirect(url_for('index'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        user = g.db['userinfo_map'].get(username)
        if username not in g.db['id_name_map'].values():
            flash('Invalid username.')
        elif hash_pwd(request.form['password']) != user.pw_hash:
            flash('Invalid password.')
        else:
            return login_user(username)
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    flash('You were logged out.')
    return redirect(url_for('index'))

def get_serialized_stickies_for_user(username):
    return jsonify(
        sticky_objects=[
            x.serialize for x in g.db['stickies_for_username'].get(username)])

@app.route('/add_sticky', methods=["POST"])
def add_sticky():
    if not session.get('logged_in'):
        flash('You must be logged in to use this functionality.')
        abort(401)
    print request.form['note_body']
    user = g.db['userinfo_map'].get(session['username'])
    new_sticky = stickies_model.StickyNote(
        user,
        stickies_model.Position(0, 0, 0),
        stickies_model.TextContent(request.form['note_body']),
        g.db.get('current_stickyid')
    )
    g.db['current_stickyid'] += 1
    g.db['stickies_for_username'].get(session['username']).append(new_sticky)
    print g.db['stickies_for_username'].get(session['username'])
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)
