Smoke = {
	print: function(v) {
		// use the jquery print plugin if it is available or fall back to toString();
		return (jQuery && jQuery.print) ? jQuery.print(v) : v.toString();
	},
	
	printArguments: function(args) {    
		var args = (args || []), a = [];
		for(var i = 0; i < args.length; i++) {
		   a.push(Smoke.print(args[i]));
		}
		return '(' + a.join(', ') + ')';	  		        
	}	
};