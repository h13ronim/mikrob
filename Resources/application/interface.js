/**
 *
 * Interface singleton - manages the tabs, views, columns and single purpose windows/sections
 * TODO this object needs to be turned into a class and service specific functions need to go to
 * its subclasses
 * @package mikrob.class.interface
 * @author Lukasz
 */

var Interface = new Class.create({
    initialize :function(container_id, service_id) {
      this.container_id = container_id;
      this.service_id = service_id;
      this.globalLimit = 20;
      this.throbber = $('throbber');
      this.character_limit = 140;

      this.ok_image = "app://mikrob_icon_ok.png";
      this.not_ok_image = "app://mikrob_icon_error.png";
      try {
        var window = Titanium.UI.getMainWindow(); // get the main window
        this.note = Titanium.Notification.createNotification(window);
      } catch (notify_error) {
        // who cares?
      }


    },
    afterSend : function(resp, was_success) {

      this.throbber.toggle();
      this.notify(Titanium.App.getName(),'Wysłano','ok');
      if(attachment != "") {
        attachment = "";
      }
      try {
        $('charcount').update('0');
      } catch (no_ch_err){ console.dir(no_ch_err); }

      if (was_success) {
        this.setAreaContent();
        $('main_textarea').enable();
      }
    },
    notify : function(login, body,img) {
      this.note.setTitle(services[this.service_id].login+"@"+services[this.service_id].type+": "+login); //Add the title;
      this.note.setMessage(body); //Add the message;
      try {
        if(img != undefined && img.startsWith("http")) {
          img = Application.cache_io(img, "av"); // investigate linux
        }
      } catch(ca_er) {
        img = "app://mikrob_icon.png";
        console.dir(ca_er);
      }

      this.note.setIcon(img);
      this.note.show();//Make it appear with the default timings.

    },
    setUnreadCount : function(count_str) {
      if(count_str =='0') {
        count_str ="0";
      }
      $('mark_as_read_button').update(count_str);
    },
    setUserAvatar : function(av_ob,login) {
      var av = "http://blip.pl/user_generated/"+av_ob.url_30 || "app://icons/nn_standard.png";
      var av_el = new Element("img", { width: "24px", height : "24px", "class" : "home_button_img", "src" : av});
      $('user_icon').update(av_el);
    },
    loginFail : function() {

    },
    setAreaContent : function(string, is_prepend) {
      try {
        var mt = $('main_textarea');
        if (string) {
          var old = mt.getValue();
          if(is_prepend) {
            mt.setValue(string+" "+old);
          } else {
            mt.setValue(old+" "+string);
          }
          mt.focus();
        } else {
          mt.setValue("");
        }
        mt.select();
        mt.selectionEnd = mt.getValue().length;
        mt.focus();
      } catch(no_mt) {
        console.dir(no_mt);
      }

    },

    attach_file : function() {
      var uwin = Titanium.UI.getCurrentWindow();
      var element = $('attach_file');
      if(attachment == "") {
        uwin.openFileChooserDialog(
          function(file){
            attachment = file[0];
            console.log(attachment);
            element.setAttribute("title", attachment);
        });
      } else {
        attachment = "";
        element.setAttribute("title", "");
      }

    },
      sidebar_toggle: function() {
        var sidebar = $('sidebar');
        var toggled = {
          "left" : "0px",
          "max-width" : "475px"
        };
        var visible = {
          "left" : "135px",
          "max-width" : "400px"
        };
        var config = {
          duration : 0.5
        };
        if(sidebar.visible()){
          config.style = toggled;
          config.afterFinish = function() {sidebar.toggle(); };
          new Effect.Morph('content_container',config);
          $('sidebar_toggle').down('img').setAttribute("src", "app://icons/ui/48_arr_right.png");

        } else {
          sidebar.toggle();
          config.style = visible;
          new Effect.Morph('content_container',config);
          $('sidebar_toggle').down('img').setAttribute("src", "app://icons/ui/48_arr_left.png");
        }
      }
    });
// why this is here?

var utfs = "☺☻☹★✩✫♫♪♥♦♣♠✿❀❁❄☾☂☀☁☃☄☮☯☎❦♀♂☚☛☠☢☣☤✌✍✎✂✆✈✉✔✘☥☸☦☧☨✝☩☪☭♚♛♜♝♞♟®™♈♉♊♋♌♍♎♏♐♑♒♓…∞¥€£≤≥«»≠≈∫∑∏µ∆øπΩ•÷‰⇐⇒⇔√";


var BodyParser =
  (function() {
     var findLinks = /http(s)*:\/\/[0-9a-z\,\;\_\/\.\-\&\=\?\%]+/gi;

     var findUsers = /(\^|\@)\w{1,}/g;

     var findTags = /#[a-zA-Z0-9ęóąśłżźćń_\-]*/gi;

     function userLink(body,   domain) {
       var element = new Element("a", {"class" : "user_link"});
       var users = body.match(findUsers);
       (users || []).each(
         function(user){
           element.update(user);
           var url = "http://"+domain+"/"+user.substring(1);
           if(user.startsWith("^")) {
             url += "/dashboard";
           }
           element.setAttribute("href",url);
           body = body.replace(user, element.outerHTML);
         });
       return body;

     }
     function tagLink(body,  domain) {
       var element = new Element("a", {"class" : "tag_link"});

       var tags = body.match(findTags);
       (tags || []).each(
         function(tag){
	         var url = "http://"+domain+"/"+tag.substring(1);
           element.setAttribute("href",url);
           element.update(tag);
           body = body.replace(tag, element.outerHTML);
         });
       return body;
     }
     function justLink(body) {
       var element = new Element("a", {"class" : "external_link"});
       var links = body.match(findLinks);
       (links || []).each(
         function(link){
           element.setAttribute("href",link);
           element.addClassName(attach_special_class(link));
           element.update(link);
           if(link.match('/blip.pl/') != null) element.addClassName("quoted_link");
           if(link.match('/rdir.pl/') != null) element.addClassName("rdir_link");
           body = body.replace(link, element.outerHTML);
         });
       return body;
     }

     function attach_special_class(url) {
        // it would be cool to have some ruby here...
       // but we'll do it differently
       var prefix = "special_";
       if(url.match("/wrzuta/gi")) { return prefix+"wrzuta"; }
       if(url.match("/youtube/gi")) { return prefix+"youtube"; }
       if(url.match("/vimeo/gi")) { return prefix+"vimeo"; }
       return "";
     }
     return {
       userLink : userLink,
       justLink : justLink,
       tagLink : tagLink
     };
   })();
