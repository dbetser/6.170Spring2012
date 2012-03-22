#! /usr/bin/env python

from wsgiref.simple_server import make_server

# invoke using e.g. http://yourhost.edu:61700/?Mary
def application(environ, start_response):

   # Sorting and stringifying the environment key, value pairs

   query = environ['QUERY_STRING']
   response_body = '<html><head><title>Response</title><body>Hello, '\
                   + query + '. I am a python WSGI server</body></html>'

   status = '200 OK'
   response_headers = [('Content-Type', 'text/html'),
                  ('Content-Length', str(len(response_body)))]
   start_response(status, response_headers)

   return [response_body]

# Instantiate the WSGI server.
# It will receive the request, pass it to the application
# and send the application's response to the client
httpd = make_server(
   'auk.csail.mit.edu', # The host name.
   61700, # A port number where to wait for the request.
   application # Our application object name, in this case a function.
   )

# Wait for a single request, serve it and quit.
httpd.handle_request()
