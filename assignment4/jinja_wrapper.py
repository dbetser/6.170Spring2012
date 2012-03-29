# Copyright 2012 Dina Betser.
#
import os
import string
import sys

from jinja2 import Environment
from jinja2 import FileSystemLoader

class JinjaWrapper(object):
  """Wrapper for Jinja library methods. Injects values into HTML templates."""

  def __init__(self, input_file, output_file, image_dir, metadata_fields):
    self.input_file = input_file
    self.output_file = output_file
    self.pgm = PhotoGalleryManager(image_dir, metadata_fields)
    self.InitEnvironment()

  def InitEnvironment(self):
    """Initialize the Jinja environment and store the template in the class."""
    env = Environment(loader=FileSystemLoader('.'))
    self.template = env.get_template(self.input_file)

  def OutputHtml(self):
    """Inject the image data into the HTML template.

    Results are written to the output_file specified in the member variable.
    """
    images = self.pgm.GetImageObjects()

    filestring = self.template.render(image_objs=images)
    website_file = open(self.output_file, 'w')
    website_file.write(filestring)
    website_file.close()

if __name__ == '__main__':
  # Parse command-line args.
  if len(sys.argv) < 5:
    print ('Correct usage: photo_gallery.py <image_directory> <output_filename> '
           '<comma-separated list of metadata fields> <input_filename>')
  else:
    image_dir = sys.argv[1]
    metadata_fields = string.split(sys.argv[3], ',')
    output_filename = sys.argv[2]
    input_filename = sys.argv[4]
    wrapper = JinjaWrapper(input_filename, output_filename, image_dir,
                           metadata_fields)
    wrapper.OutputHtml()
