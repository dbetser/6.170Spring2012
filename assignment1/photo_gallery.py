# Copyright 2012 Dina Betser.
import os

from jinja2 import Environment
from jinja2 import FileSystemLoader

from iptcinfo import IPTCInfo

class ImagePathCaption(object):
  """Struct-like object to store an image's path and caption."""

  def __init__(self, image_path, caption):
    self.path = image_path
    self.caption = caption


class PhotoGalleryManager(object):
  """Manages the photo gallery application."""
  def __init__(self, image_directory, metadata_fields):
    """
    
    Args:
      image_directory: directory containing images (with last slash included).
    """
    self.dir = image_directory
    self.meta_fields = metadata_fields
    self.image_objs = []
    self.SetImageObjects()

  def SetImageObjects(self):
    """"""
    dir_list = os.listdir(self.dir)
    print self.dir
    print dir_list
    for fname in dir_list:
      self.image_objs.append(ImagePathCaption(
          self.dir + fname, self.LoadIptcDataForFile(self.dir + fname)))

  def GetImageObjects(self):
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
        caption += 'Field name: ' + field + '; Value: ' + info.data[field] + '\n'
      else:
        print 'caption could not be read.'
    print caption
    return caption

  def SetNewMetadataFields(self, metadata_fields):
    """Sets the metadata fields of the images to use for the caption.
    
    Args:
      metadata_fields: A list of the names of the metadata fields.
    """
    self.meta_fields = metadata_fields


if __name__ == "__main__":
  env = Environment(loader=FileSystemLoader('templates'))
  template = env.get_template('photo_gallery.html')
  
  pgm = PhotoGalleryManager('images/', ['caption/abstract'])
  images = pgm.GetImageObjects()

  filestring = template.render(name='frango', image_objs=images)
  website_file = open('website.html', 'w')
  website_file.write(filestring)
  website_file.close()
