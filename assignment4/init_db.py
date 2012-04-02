# Copyright 2012 Dina Betser.
# Script to set up the database for 6.170 Assignment #4.
import shelve
import main


def reset_db(db_name):
    '''Initialize/reset the database.'''
    db = shelve.open(db_name)
    db['userinfo_map'] = {}
    db['id_name_map'] = {}
    db['stickies_for_username'] = {}
    db['current_userid'] = 0
    db['current_stickyid'] = 0
    db.close()


if __name__ == '__main__':
    reset_db(main.DATABASE)
