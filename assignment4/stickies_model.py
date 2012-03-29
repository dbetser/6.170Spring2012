# Copyright 2012 Dina Betser.
# Network Stickies model for 6.170 Assignment #4.
import os
import shelve

from flask import Flask, request
from flaskext.login import LoginManager
from jinja2 import Environment
from jinja2 import FileSystemLoader


# Model

class User(UserMixin):
    def __init__(self, name, id, active=True):
        self.name = name
        self.id = id
        self.active = active

    def is_active(self):
        return self.active


class Anonymous(AnonymousUser):
    name = u"Anonymous"


class StickyNote(object):
    """Represent a sticky note."""
    def __init__(self, user, position, content):
        self.user = user
        self.pos = position
        self.content = content


class Content(object):
    """Abstract class representing the content of a sticky note."""
    def get_content(self):
        raise NotImplementedError
    def set_content(self, content):
        raise NotImplementedError


class TextContent(Content):
    """Stores the content of a sticky note as a string."""
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


if __name__ == '__main__':
    app.run()
