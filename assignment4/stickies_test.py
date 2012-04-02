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
        flaskr.app.config['TESTING'] = True
        self.app = main.app.test_client()
        init_db.reset_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(main.app.config['DATABASE'])

if __name__ == '__main__':
    unittest.main()
