Smoke = {
	print: function(v) {
		// use the jquery print plugin if it is available or fall back to toString();
		return (jQuery && jQuery.print) ? jQuery.print(v) : v.toString();
	},
	
	printArguments: function(args) {    
    var a = [];
    if (args === undefined) args = '';
    if ((args && args.callee) || (args instanceof Array)) {
      for(var i = 0; i < args.length; i++) {
        a.push(Smoke.print(args[i]));
      }      
    } else {
      // Workaround for jQuery.print returning "null" when called with an empty string.
      if (!args && (typeof args == 'string')) {
        a.push('');
      } else {
        a.push(Smoke.print(args));
      }
    }
		return '(' + a.join(', ') + ')';
	}	
};