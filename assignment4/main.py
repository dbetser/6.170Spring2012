# Copyright 2012 Dina Betser.
# Network Stickies main script for 6.170 Assignment #4.

import stickies_model

import hashlib
import os
import shelve
import sys

from flask import (Flask, render_template, redirect, url_for, flash, request,
                   jsonify, session, g, abort)

# Configuration.
DATABASE = 'db/stickies_database.db'

# Create the Flask application.
app = Flask(__name__)
app.config.from_object(__name__)
app.debug = True
app.secret_key = 'secretkey'


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
    if session.get('logged_in') is not None:
        username = session.get('username')
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

@app.route('/add_sticky', methods=['POST'])
def add_sticky():
    if not session.get('logged_in'):
        abort(401)
    user = g.db['userinfo_map'].get(session['username'])
    new_sticky = stickies_model.StickyNote(
        user,
        stickies_model.Position(0, 0, 0),
        stickies_model.TextContent(request.form['note_body']),
        g.db.get('current_stickyid')
    )
    g.db['current_stickyid'] += 1
    g.db['stickies_for_username'].get(session['username']).append(new_sticky)
    return redirect(url_for('index'))


def remove_sticky_from_stickylist(stickies, id):
    '''Helper to remove the sticky with the given id from the stickies list.'''
    idx_to_remove = None
    for idx in range(len(stickies)):
        # Type of id is unicode, so must be cast to an int.
        if stickies[idx].id == int(id):
            idx_to_remove = idx
    if idx_to_remove is not None:
        stickies.pop(idx_to_remove)
        return 'Sticky with id ' + id + ' was removed successfully.'
    else:
        return 'Sticky with id ' + id + ' could not be found.'

@app.route('/delete_sticky', methods=['POST'])
def delete_sticky():
    if not session.get('logged_in'):
        abort(401)
    msg = remove_sticky_from_stickylist(
        g.db['stickies_for_username'].get(session['username']),
        request.form['note_id']
    )
    if app.debug:
        print msg
    return redirect(url_for('index'))

@app.route('/get_sticky_content', methods=['POST'])
def get_sticky_content():
    if not session.get('logged_in'):
        flash('You must be logged in to use this functionality.')
        abort(401)
    return get_sticky_text(
        g.db['stickies_for_username'].get(session['username']),
        request.form['note_id']
    )

def get_sticky_text(stickies, id):
    '''Helper to get the text content of a sticky in the database.'''
    sticky_idx = None
    for idx in range(len(stickies)):
        # Type of id is unicode, so must be cast to an int.
        if stickies[idx].id == int(id):
            sticky_idx = idx
    if sticky_idx is None: # TODO error handling
        return None
    sticky_instance = stickies[sticky_idx]
    return sticky_instance.content.get_content()

@app.route('/move_sticky', methods=['POST'])
def move_sticky():
    if not session.get('logged_in'):
        abort(401)
    update_sticky(
        g.db['stickies_for_username'].get(session['username']),
        request.form['note_id'], None,
        stickies_model.Position(request.form['x'], request.form['y'],
                                request.form['z'])
    )
    return redirect(url_for('index'))

def update_sticky(stickies, id, new_text, new_pos):
    '''Helper to update attributes of a sticky in the database.'''
    sticky_idx = None
    for idx in range(len(stickies)):
        # Type of id is unicode, so must be cast to an int.
        if stickies[idx].id == int(id):
            sticky_idx = idx
    if sticky_idx is None:
        return 'Could not find sticky with id ' + id
    sticky_instance = stickies[sticky_idx]
    msg = ''
    if new_text is not None:
        sticky_instance.content.set_content(new_text)
        msg += 'Updated content of sticky with id ' + str(id) + '. '
    if new_pos is not None:
        sticky_instance.pos = new_pos
        msg += 'Moved sticky with id ' + str(id) + ' to position ' + str(new_pos) + '.'
    if app.debug:
        print msg
    return msg

@app.route('/edit_sticky', methods=['POST'])
def edit_sticky():
    print "edit sticky reached", session
    if not session.get('logged_in'):
        abort(401)
    print request.form['note_id']
    update_sticky(
        g.db['stickies_for_username'].get(session['username']),
        request.form['note_id'], request.form['note_body'], None
    )
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
