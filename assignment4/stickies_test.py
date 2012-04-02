# Copyright 2012 Dina Betser.
# Network Stickies main test file for 6.170 Assignment #4.

import init_db
import main
import os
import unittest
import tempfile

class StickiesTestCase(unittest.TestCase):

    def setUp(self):
        self.db_fd, main.app.config['DATABASE'] = tempfile.mkstemp()
        os.remove(main.app.config['DATABASE'])
        main.app.config['TESTING'] = True
        self.app = main.app.test_client()
        init_db.reset_db(main.app.config['DATABASE'])

    def tearDown(self):
        os.stat(main.app.config['DATABASE'])
        os.close(self.db_fd)
        os.unlink(main.app.config['DATABASE'])

    def register(self, username, password):
        return self.app.post('/register', data=dict(
            username=username,
            password=password
        ), follow_redirects=True)

    def login(self, username, password):
        return self.app.post('/login', data=dict(
            username=username,
            password=password
        ), follow_redirects=True)

    def logout(self):
        return self.app.get('/logout', follow_redirects=True)

    def test_login_logout(self):
        rv = self.login('fakeuser', '')
        assert 'Invalid username' in rv.data
        rv = self.register('admin', 'default')
        assert 'You were logged in' in rv.data
        rv = self.logout()
        assert 'You were logged out' in rv.data
        rv = self.login('admin', 'default')
        assert 'You were logged in' in rv.data
        rv = self.login('admin', 'defaultx')
        assert 'Invalid password' in rv.data
        rv = self.register('admin', 'again')
        assert 'Username already exists' in rv.data

    def test_not_logged_in_aborts(self):
        rv = self.app.post('/add_sticky', data=dict(
            note_body='here is a sticky'
        ), follow_redirects=True)
        assert '401' in rv.data

    def add_sticky_helper(self):
        self.register('admin', 'default')
        rv = self.app.post('/add_sticky', data=dict(
            note_body='here is a sticky'
        ), follow_redirects=True)
        return rv

    def test_add_sticky(self):
        rv = self.add_sticky_helper()
        assert 'here is a sticky' in rv.data

    def test_edit_remove_sticky(self):
        rv = self.add_sticky_helper()
        assert 'here is a sticky' in rv.data
        rv = self.app.post('/edit_sticky', data=dict(
            note_body='here we have a sticky',
            note_id=0
        ), follow_redirects=True)
        assert 'here we have a sticky' in rv.data
        rv = self.app.post('/delete_sticky', data=dict(
            note_id=0
        ), follow_redirects=True)
        assert 'here we have a sticky' not in rv.data


if __name__ == '__main__':
    unittest.main()
