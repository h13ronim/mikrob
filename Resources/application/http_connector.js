/**
 * Class for establishing HTTP/REST connections
 * It utiilizes Titanium's native HTTPClient
 * Sort of works like JS native XHR, but has few extras - sending files and ability to specify the user agent
 * The constructor takes base API url as a param
 * @namespace app.class
 * @author Łukasz Korecki
 */
var HttpConnector = new Class.create({
  initialize : function(options) {
    this.client = Titanium.Network.createHTTPClient();

    this.client.setTimeout(15000);
    // TODO add custom user agent
    this.headers = this.setRequestHeaders(options || {});
    // overrrrrrride the UA (http headers seem to have no effect)
    var ua =  Titanium.App.getName()+" "+Titanium.App.getVersion() + " ["+Titanium.App.getPublisher()+" "+Titanium.App.getID().split('.').reverse().join('.').replace('.','@',1)+"]";
    this.client.userAgent =ua;
//    this.client.userAgent = 'deskBlip 0.7.9';

  },
/**
 * @param object - Object literal representing request headers (i.e{'Content-Type':'application/json'});
 */
  setRequestHeaders : function(obj) {
    var self = this;
    for (header in obj) {
      self.client.setRequestHeader(header, obj[header] );
    }
    return obj;

  },
  handleResponse : function(status,response_object) {
     var self = this;

     switch(status) {
       case 200:
       case 201:
         self.onSuccess(status, response_object.responseText);
         break;
       case 204:
        // do nothing :-)
         break;
       case 401:
       case 403:
       case 404:
       case 500:
       case 501:
       case 503:
         self.onFail(status, response_object.responseText);
         break;
       default:
         self.onFail(status, response_object.responseText);
         break;
     }
   },

/**
 * Sets Basic auth details
 *  @param string username
 *  @param string password
 */
  setUserCred : function(login, pass) {

    this.login = login;
    this.password = pass;
    this.client.setBasicCredentials(login,pass);
    this.client.setRequestHeader('Authorization', "Basic "+btoa(login+":"+pass));
    return btoa(login+":"+pass);
  },
/**
 * GET request to a given resource
 * @param string resource i.e. '/users/get/id'
 */
  debug_response : function(method, url, client) {
   return true;
    console.log("HttpConnector: \n" + url + "\nmethod: "+method+"\nstatus: ");
    console.log(this.client.status + " " + this.client.statusText);
  },
  get : function(url) {
    var self = this;

    self.client.onreadystatechange = function() {
      if(this.readyState == self.client.DONE) {
        self.handleResponse(self.client.status, self.client);
        self.debug_response('get', url, self.client);
      }
    };
    if(self.login && self.password) {
      self.client.open("GET",url, true, self.login, self.password);
    } else {
      self.client.open("GET",url);
    }
      self.client.send(null);
  },
/**
 * DELETE request to a given resource
 * @param string resource i.e. '/users/get/id'
 */
  'delete' : function(url) {
    var self = this;

    self.client.onreadystatechange = function() {
      if(this.readyState == self.client.DONE) {

        self.handleResponse(self.client.status, self.client);
        self.debug_response('delete', url, self.client);
      }
  };
    if(self.login && self.password) {
      self.client.open("DELETE",url, true, self.login, self.password);
    } else {
      self.client.open("DELETE",url);
    }
    self.client.send(null);
  },
/**
 * PUT request to a given resource
 * @param string resource i.e. '/users/get/id'
 */
  put : function(url) {
    var self = this;
    self.client.onreadystatechange = function() {
      if(this.readyState == self.client.DONE) {
        self.handleResponse(self.client.status, self.client);
        self.debug_response('put', url, self.client);
      }
    };
    if(self.login && self.password) {
      self.client.open("PUT",url, true, self.login, self.password);
    } else {
      self.client.open("PUT",url);
    }
      self.client.send(null);
  },
/**
 * POST request to a resource
 * @param string resource - '/somewhere'
 * @param string data - post data to be sent - needs to be a query string and URIencoded
 */
  post : function(url, data) {
    var self = this;

    self.client.onreadystatechange = function() {
      if(this.readyState == self.client.DONE) {
        self.handleResponse(self.client.status, self.client);
        self.debug_response('post', url, self.client);
      }
    };
    if(self.login && self.password) {
      self.client.open("POST",url, true, self.login, self.password);
    } else {
      self.client.open("POST",url);
    }
      self.client.send(data);
  },
/**
 * POST request to a resource and send a file along with a number of params-values
 * Adopted from:
 * http://www.sergemeunier.com/blog/titanium-tutorial-how-to-upload-a-file-to-a-server
 * XXX not tested!
 * @param string resource - '/somewhere'
 * @param file file - file to be sent
 * @param string data -  object literal of post data to be sent {"name" : "dupiszon"}
 */
  postFile : function(url,file, file_var, data, additional_headers) {
    var self = this;
    var t=(new Date()).getTime();
    var boundary = '----kawusia-i-ciasteczka-'+t;
    var header ='';
    var post_file_var = file_var || file.split('/').last();
    for (v in data) {
      header += "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\""+v+"\"\r\n\r\n" + data[v] + "\r\n";
    }

    header += "--" + boundary + "\r\n";
    header += "Content-Disposition: form-data; name=\"" + post_file_var + "\"; ";
    header += "filename=\"" + file.split('/').last() + "\"\r\n"; //";
    header += "Content-Type: application/octet-stream\r\n\r\n";



    var uploadFile = Titanium.Filesystem.getFile(file);
    var uploadStream = Titanium.Filesystem.getFileStream(uploadFile);

    uploadStream.open(Titanium.Filesystem.FILESTREAM_MODE_READ);
    content = uploadStream.read();
    uploadStream.close();

    var fullContent = header + content + "\r\n--" + boundary + "--";


    self.setRequestHeaders(additional_headers );
     var h = {
       "Content-type": "multipart/form-data; boundary=\"" + boundary + "\"",
       "Connection": "close"
    };
    self.setRequestHeaders(h);
    self.client.onreadystatechange = function() {

      if(this.readyState == self.client.DONE) {
        self.handleResponse(self.client.status, self.client);
        self.debug_response('post with file', url, self.client);
      }
    };
      self.client.open("POST",url);
      self.client.send(fullContent);
  },
  postFile2 : function(url, file) {

    var uploadFile = Titanium.Filesystem.getFile(file);
    var self = this;
    self.client.onreadystatechange = function() {
      if(this.readyState == self.client.DONE) {
        self.handleResponse(self.client.status, self.client);
        self.debug_response('post', url, self.client);
      }
    };
      self.client.open("POST",url);
      self.client.send(uploadFile);

  },
/**
 * Fired when request was successfull
 * @param string http status code
 * @param string repsonseText of the HTTTPRequest
 */
  onSuccess : function(status, responseText) {},
/**
 *  Fired in case of 501, 403 etc
 * @param string http status code
 * @param string repsonseText of the HTTTPRequest
 */
  onFail : function(status, responseText) {}
});
