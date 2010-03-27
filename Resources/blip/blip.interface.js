var BlipInterface = new Class.create(Interface, {
  initialize : function($super, container_id, service_id) {
    $super(container_id, service_id);
    this.character_limit = 160;
  },
	status_lis : [],

  getUpdateObject : function(blip) {
    var single_status = {};
    switch(blip.type) {
      case 'Notice':
        single_status = new Notice(blip, this.service_id);
        break;
      case 'PrivateMessage':
        single_status = (blip.user.login == 't') ? new TwitterBlip(blip, this.service_id) : new Message(blip, true, this.service_id);
      break;
      case 'DirectedMessage':
        single_status = new Message(blip, false, this.service_id);
        break;
      default:
        single_status = new Update(blip, this.service_id, services[this.service_id].login);
        break;
    }
    return single_status;

  },
  drawPage : function(updates) {
    var self = this;
    var len = updates.length;

    var dash = $(self.container_id);
    dash.update();
    updates.each(function(blip){
      var single_status = self.getUpdateObject(blip);
      dash.insert({'bottom': single_status});
      self.expandLink('quoted_link');
    });
    // not very clever way of scrolling up ;-)
    dash.scrollByLines(-(dash.scrollHeight));
    self.throbber.toggle();
  },
  draw : function(updates,is_update) {
    var self = this;
    var len = updates.length;
    var dash = $(self.container_id);
    if(is_update !==0) updates.reverse();
    updates.each(function(blip, index){
     var single_status=null;
      try {
        single_status = self.getUpdateObject(blip);
      } catch (guo_err) { console.dir(guo_err); }
        if(is_update !== 0) {
          dash.insert({'top': single_status});
        } else {
          dash.insert({'bottom': single_status});
        }
        self.expandLink('quoted_link');
       console.log("is_update: "+ is_update);
			 if (is_update !== 0) {
        var av =  'app://icons/nn_nano.png';
        if(single_status.user.avatar) {
          av = 'http://blip.pl'+single_status.user.avatar.url_50;
        }
         self.notify(single_status.user.login, single_status.raw_body, av );
      }


    });
    self.expandLink("rdir_link");

    if (  is_update ===0) {
      self.setUnreadCount('0');
    } else {
      var unr = $$('#'+self.container_id + ' .unread').length;
      self.setUnreadCount(""+unr);
    }
    self.throbber.toggle();
  },
  expandLink : function(target_class) {
    var els = $$('.'+target_class);
    els.each(function(el) {
      var _link = el.readAttribute('href');
      var id=null;
      if(_link.search('blip') != -1) {
        id = _link.split('/').last();
        services[0].getBlip(id);
        el.addClassName('s'+id +" expanded_link");
      }
      if (_link.search('rdir') != -1) {

        id = _link.split('/').last();
        services[0].expandLink(id);
        el.addClassName('r'+id);
      }
      el.removeClassName(target_class);
    });
  },
  injectQuotedBlip : function(target_class, obj) {
    var self = this;
    var els = $$('.s'+target_class);
    els.each(function(el) {
      el.update('[Blip]');
      el.observe('click', function(event) {
        event.preventDefault();

        var blip = self.getUpdateObject(obj);
        var contents = blip.toQuoted();
        contents.addClassName('quoted');
        var elem = el.up('p') || el.up() || false; //.next();
        if(elem) {
          elem.insert({'after':contents});
        }
        el.descendants().invoke('stopObserving');
        el.stopObserving().remove();
        self.expandLink('quoted_link');
      });
    });
  },
  expandShortenUrl : function(id, obj) {
    var els = $$('.r'+id);
    els.each(function(el) {
      el.update();
      el.insert('[');
      el.insert(obj.original_link.split('/')[2]);
      el.insert(']');
      var stats_link = new Element('a',{
        'href':'http://rdir.pl/'+id+'/stats',
        'class':'small external_link',
        'target':'_blank'
        }
      ).update('s' + '('+obj.hit_count+')');
      el.insert({'after':stats_link});
      el.removeClassName('r'+id);
      el.addClassName('external_link');
    });

  },
  shortenLinksInString : function(string,shorten_function,exceptions) {
    var findLinks = /http:\/\/\S+/gi;
    var rez = string.match(findLinks);
    if(rez) {
      rez.each(function(link) {
        if( link.search('blip.pl') ==-1) services[0].shortenLink(link);
      });
    } else { console.log('nic nie teges'); }
  },
  replaceLinks : function(old_stuff, new_stuff) {
    var content = $('main_textarea').getValue();
    var content_n = content.replace(old_stuff, new_stuff);
    $('main_textarea').setValue(content_n);
   }
});
