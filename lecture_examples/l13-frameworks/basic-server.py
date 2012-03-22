import socket, re

# access by opening e.g. http://yourhost.edu:61700/?name=David
HOST = ''        
PORT = 61700
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind((HOST, PORT))
s.listen(1)
conn, addr = s.accept()
buf = ''
print 'Connected by', addr
while 1:
    data = conn.recv(1024)
    if not data: break
    buf = buf+data
    h = re.search('^GET.*\?name=(\S*)', buf)
    if h: break;
print 'received\n' + buf
response='\nHTTP/1.0 200 OK\nContent-Type: text/html\n' \
         + '\n<html><head><title>Simple Server</title></head>' \
         + '<body> Hello, ' + h.group(1) + '. I am a server.</body></html>\n\n\n'
conn.sendall(response)
conn.close()
print 'closed'
