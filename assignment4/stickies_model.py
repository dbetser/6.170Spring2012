# Copyright 2012 Dina Betser.
# Network Stickies model for 6.170 Assignment #4.
import os
import shelve

from flask import Flask, request
from flaskext.login import UserMixin, AnonymousUser
from jinja2 import Environment
from jinja2 import FileSystemLoader


class User(UserMixin):
    def __init__(self, name, id, passwd_hash, active=True):
        self.name = name
        self.id = id
        self.pw_hash = passwd_hash
        self.active = active

    def is_active(self):
        return self.active

    def get_auth_token(self):
        return make_secure_token(self.name, self.pw_hash)

    @property
    def serialize(self):
       """Return object data in easily serializeable format"""
       return {
           'id': self.id,
           'name': self.name
       }


class Anonymous(AnonymousUser):
    name = u"Anonymous"


class StickyNote(object):
    """Represent a sticky note."""
    def __init__(self, user, position, content, id):
        self.user = user
        self.pos = position
        self.content = content
        self.id = id
    @property
    def serialize(self):
       """Return object data in easily serializeable format"""
       return {
           'user': self.user.serialize,
           'pos': self.pos.serialize,
           'content': self.content.get_content(),
           'id': self.id
       }


class Content(object):
    """Abstract class representing the content of a sticky note."""
    def get_content(self):
        raise NotImplementedError
    def set_content(self, content):
        raise NotImplementedError


class TextContent(Content):
    """Stores the text content of a sticky note as a string."""
    def __init__(self, text):
        self.content = text
    def get_content(self):
        return self.content
    def set_content(self, content):
        self.content = content


class Position(object):
    """Stores the x, y, and z coordinates of a sticky note."""
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z
    @property
    def serialize(self):
       """Return object data in easily serializeable format"""
       return {
           'x': self.x,
           'y': self.y,
           'z': self.z
    }


if __name__ == '__main__':
    app.run()
