# Copyright 2012 Dina Betser.
# Photo gallery main file for 6.170 Assignment #1.
# Usage: photo_gallery.py <image_directory> <output_filename>
#                         <comma-separated list of metadata fields.>

import os
import string
import sys

from jinja2 import Environment
from jinja2 import FileSystemLoader

from iptcinfo import IPTCInfo

class ImageDataObject(object):
  """Struct-like object to store all information needed to display an image."""

  def __init__(self, image_path, caption, prev_path, next_path):
    self.path = image_path
    self.caption = caption
    self.prev = prev_path
    self.next = next_path

  def __repr__(self):
    return ('Path: ' + self.path + ';\nCaption: ' + self.caption
            + ';\nPrev: ' + self.prev + ';\nNext: ' + self.next)


class PhotoGalleryManager(object):
  """Manages the photo gallery application."""

  def __init__(self, image_directory, metadata_fields):
    """Constructor for the PhotoGalleryManager object.

    Args:
      image_directory: directory containing images (with last slash included).
      metadata_fields: list of field names for which to retrieve the images'
        values.
    """
    self.dir = image_directory
    self.meta_fields = metadata_fields
    self.image_objs = []
    self.SetImageObjects()

  def SetImageObjects(self):
    """Generate all of the image objects; store them in the class variable."""
    dir_list = os.listdir(self.dir)
    for file_index in range(len(dir_list)):
      self.image_objs.append(ImageDataObject(
          self.dir + dir_list[file_index],
          self.LoadIptcDataForFile(self.dir + dir_list[file_index]),
          dir_list[(file_index - 1) % len(dir_list)],
          dir_list[(file_index + 1) % len(dir_list)]
      ))

  def GetImageObjects(self):
    for obj in self.image_objs:
      print obj
    return self.image_objs

  def LoadIptcDataForFile(self, filename):
    """Retrieves the caption for the given file."""
    # Create new info object.
    info = IPTCInfo(filename)
  
    # Check if file had IPTC data.
    if len(info.data) < 4:
      print 'Could not process file ', filename
      raise Exception(info.error)
  
    # Get specific attributes.
    caption = ''
    for field in self.meta_fields:
      print field, info.data[field]
      if info.data[field] is not None:
        caption += field + ': ' + info.data[field] + '.'
      else:
        print 'Caption could not be created for field ' + field
    return caption

  def SetNewMetadataFields(self, metadata_fields):
    """Sets the metadata fields of the images to use for the caption.
    
    Args:
      metadata_fields: A list of the names of the metadata fields.
    """
    self.meta_fields = metadata_fields

class JinjaBridge(object):

	def __init__(self, input_file, output_file, image_dir, metadata_fields):
	  self.input_file = input_file
	  self.output_file = output_file
	  self.pgm = PhotoGalleryManager(image_dir, metadata_fields)

  def InitEnvironment(self):
  
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template(self.input_file)
    
    images = self.pgm.GetImageObjects()
  
    filestring = template.render(image_objs=images)
    website_file = open(self.output_filename, 'w')
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

