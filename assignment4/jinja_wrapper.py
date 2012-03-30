# Copyright 2012 Dina Betser.
# Wrapper to encapsulate interactions with Jinja2 library.

import os
import string
import sys

from jinja2 import Environment
from jinja2 import FileSystemLoader

class JinjaWrapper(object):
  """Wrapper for Jinja library methods. Injects values into HTML templates."""

  def __init__(self, input_file, output_file):
    self.input_file = input_file
    self.output_file = output_file
    self.InitEnvironment()

  def InitEnvironment(self):
    """Initialize the Jinja environment and store the template in the class."""
    env = Environment(loader=FileSystemLoader('.'))
    self.template = env.get_template(self.input_file)

  def OutputHtml(self, stickies):
    """Inject the image data into the HTML template.

    Results are written to the output_file specified in the member variable.
    """
    filestring = self.template.render(sticky_objects=stickies)
    website_file = open(self.output_file, 'w')
    website_file.write(filestring)
    website_file.close()
