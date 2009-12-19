/**
 * BlipApi class, extends Service class 
 * TODO make HttpConnector a class variable
 * FIXME all onSuccess and onFailure callbacks should be defined outside of the class
 * definition 
 */
var Blip = new Class.create(Service,{
	initialize : function($super, login, password) {
		$super(login, password);
	},
	api_root : 'http://api.blip.pl/',
	dashboard_last_id : 0,
	bliposphere_last_id : 0,
	tag_last_id : 0,
	current_page : 0,
	include_string_user : "?include=user,recipient",
	include_string_full : "?include=user,user[avatar],recipient,recipient[avatar],pictures&limit="+Interface.globalLimit,
	commonHeaders : function() {
		var self = this;
		return {
				'X-blip-api' : '0.02',
				'Accept' : 'application/json',
				'User-Agent' : Titanium.App.getName()+" "+Titanium.App.getVersion(),
				"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
//				'Authorization' : 'Basic '+self.credentials
			};
	},
	dashboardGet : function(offset) {
		var self = this;
		 var url = self.api_root+'dashboard'+self.include_string_full;
		if(self.dashboard_last_id !== 0) {
			 url = self.api_root+'dashboard/since/'+self.dashboard_last_id+self.include_string_full;
		}
		if(offset >= 0) {
			url += '&offset='+(offset * Interface.globalLimit);
		} else {
			url += '&offset=0';
		}
		req = new HttpConnector(self.commonHeaders());
		req.setUserCred(self.login, self.password);
		req.get(url);
		req.onSuccess = function(status,response) {
			var ob = Titanium.JSON.parse(response);
			if(ob.length >0) {
				self.dashboard_last_id= ob[0].id;
				self.dashboardProcess(ob,self.dashboard_last_id);
			}
		};
		req.onFailure = function(status, response) {
			Interface.notify('Błąd', 'Błąd połączenia z API: '+status);
		};
	},
	dashboardProcess :function(response_obj,is_update){},
	handleFailure :	function(response_obj){},
	afterSend :	function(response_obj){},
	createBlip : function(str) {
		var self = this;
		req = new HttpConnector(self.commonHeaders());
		req.setUserCred(self.login, self.password);
		try {
			req.post(self.api_root+'updates','update[body]='+encodeURIComponent(str));
		} catch (no_encodeuri_compononent) { console.dir(no_encodeuri_compononent); }
		req.onSuccess = function(resp) { self.afterSend(resp); };
		req.onFailure = function(resp) {
			Interface.notify('Błąd', 'Nie ma takiego użytkownika');
			self.afterSend(resp);
		};
	
	},
	getBlip : function(blipid) {
		var self = this;
		req = new HttpConnector(self.commonHeaders());
		req.setUserCred(self.login, self.password);
		req.get(self.api_root+'updates/'+blipid+self.include_string_full);
		req.onSuccess = function(st, resp) {
			var obj = Titanium.JSON.parse(resp);
//			Interface.setAreaContent(obj.url);
			Interface.injectQuotedBlip(blipid,obj);
		};
		req.onFailure = function(st, resp) {
			console.log(st);
			Interface.notify("Błąd","Rozwijanie linka się nie powiedło");
		};

	 },
	shortenLink : function(url) {
		var self = this;
		req = new HttpConnector(self.commonHeaders());
		req.setUserCred(self.login, self.password);
		req.post(self.api_root+'shortlinks', 'shortlink[original_link]='+url);
		req.onSuccess = function(st, resp) {
			var obj = Titanium.JSON.parse(resp);
			Interface.replaceLinks(url, obj.url);
		}; 
		req.onFailure = function(st, resp) {
			Interface.notify("Błąd","Tworzenie linka się nie powiedło");
		};
	},
	expandLink : function(id) {
		var self = this;
		req = new HttpConnector(self.commonHeaders());
		req.setUserCred(self.login, self.password);
		req.get(self.api_root+'shortlinks/'+id);
		req.onSuccess = function(st, resp) {
			var obj = Titanium.JSON.parse(resp);
			Interface.expandShortenUrl(id,obj);
		};
		req.onFailure = function(st, resp) {
			console.log(st);
			Interface.notify("Błąd","Rozwijanie linka się nie powiedło");
		};
	}
});
