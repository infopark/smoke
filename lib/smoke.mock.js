// Overide these functions for custom pass/fail behaviours
Smoke.passed = function(mock){
	Smoke.passCount++;
};

Smoke.failed = function(mock, message){
	Smoke.failCount++;
	throw(message);
};

// Some helpers
Smoke.reset = function(){
	Smoke.mocks = Smoke.mocks || [];
	for(var i=0; i<Smoke.mocks.length; i++) Smoke.mocks[i]._resetMocks();
	Smoke.mocks = [];
	Smoke.passCount = 0;
	Smoke.failCount = 0;
};
Smoke.reset();

Smoke.checkExpectations = function(){
	for(var i=0; i<Smoke.mocks.length; i++) Smoke.mocks[i]._checkExpectations();
};

Smoke.Mock = function(originalObj) {
	var obj = originalObj || {} ;
	if (obj._expectations) return obj;
	obj._expectations = {};
	obj._valuesBeforeMocking = {};

	obj.stub = function(attr){
		if (!this._valuesBeforeMocking.hasOwnProperty(attr)) {
		  this._valuesBeforeMocking[attr] = this[attr];
		}
		return new Smoke.Stub(this, attr);
	};
	
	obj.should_receive = function(attr){
		var expectation = new Smoke.Mock.Expectation(this, attr);
		this._expectations[attr] = (this._expectations[attr] || []).concat([expectation]);
		if (!this._valuesBeforeMocking.hasOwnProperty(attr)) {
		  this._valuesBeforeMocking[attr] = this[attr];
		}
		if(this._expectations[attr].length == 1) {
  		this[attr] = Smoke.Mock.Expectation.stub(this, attr);
		} 
		return expectation;
	};

	obj.should_not_receive = function(attr){
		return obj.should_receive(attr).exactly(0, "times");
	};

	obj.must_receive = function(attr) {
	  var expectation = obj.should_receive(attr);
	  expectation.at_least("once");
	  return expectation;
	}

	obj._checkExpectations = function(){
		for(var e in this._expectations) {
			var expectations = this._expectations[e]
			for(var i=0; i < expectations.length; i++) expectations[i].check();
		};
	};
	
	obj._resetMocks = function(){
		for(var attr in this._valuesBeforeMocking) {
			this[attr] = this._valuesBeforeMocking[attr];
		}
		
		delete this._valuesBeforeMocking;
		delete this._expectations;
		delete this._resetMocks;
		delete this._checkExpectations;
		delete this.stub;
		delete this.should_receive;
	};
	
	Smoke.mocks.push(obj);
	return obj;
};

Smoke.MockFunction = function(originalFunction, name) {
  name = name || 'anonymous_function';
  var mock = Smoke.Mock(function() {
    return arguments.callee[name].apply(this, arguments);
  });
  mock[name] = (originalFunction || new Function());
  mock.should_be_invoked = function() {
    return this.should_receive(name);
  }
  mock.must_be_invoked = function() {
    return this.must_receive(name);
  }
  mock.should_not_be_invoked = function() {
    return this.should_not_receive(name);
  }
  return mock;
};

Smoke.Mock.Expectation = function(mock, attr) {
	this._mock = mock;
	this._attr = attr;
	this.callCount = 0;
	this.returnValue = undefined;
	this.callerArgs = undefined;
	this.hasReturnValue = false;
};

Smoke.Mock.Expectation.stub = function(mock, attr) {
  return function() {
    return function() {
      var matched, return_value, args = arguments;
      jQuery.each(this, function() {
        if (!matched) {
          if (this.run(args)) {
            matched = true;
            return_value = this.returnValue;
          }
    	  }
      });
      if (!matched) {
        this[0].argumentMismatchError(args)
      }
      return return_value;
    }.apply(mock._expectations[attr].slice(0).reverse(), arguments);
  }
}


Smoke.Mock.Expectation.prototype = {
	exactly: function(count,type){
		// type isn't used for now, it's just syntax ;)
		this.minCount = this.maxCount = undefined;
		this.exactCount = this.parseCount(count);
		return this;
	},
	at_most: function(count,type){
		this.maxCount = this.parseCount(count);
		return this;
	},
	at_least: function(count,type){
		this.minCount = this.parseCount(count);
		return this;
	},
	with_arguments: function(){
		this.callerArgs = arguments;
		return this
	},
	with_any_arguments: function(){
	  this.acceptAnyArguments = true;
		return this
	},
	run: function(args){
	  if (this.throwException) {
	    throw this.throwException;
	  }
	  else if (this.executeFunction) {
	    this.callCount+=1;
	    this.hasReturnValue = true;
	    this.returnValue = this.executeFunction.apply(null, args);
	    return true;
	  }
		else if(this.acceptAnyArguments) {
      this.callCount+=1;
      return true;
    }
    else if((this.callerArgs === undefined) || Smoke.compareArguments(args, this.callerArgs)) {
			return !!(this.callCount+=1);
		};
		return false
	},
	and_return: function(v){
	  this.hasReturnValue = true;
		this.returnValue = v;
	},
	and_throw: function(e){
	  this.throwException = e;
	  return this;
	},
	and_execute: function(fn){
	  this.executeFunction = fn;
	  return this;
  },
	check: function(){
		if(this.exactCount!=undefined) this.checkExactCount();
		if(this.minCount!=undefined) this.checkMinCount();
		if(this.maxCount!=undefined) this.checkMaxCount();
	},
	checkExactCount: function(){
		if(this.exactCount==this.callCount) Smoke.passed(this)//console.log('Mock passed!')
		else Smoke.failed(this, 'expected '+this.methodSignature()+' to be called exactly '+this.exactCount+" times but it got called "+this.callCount+' times');
	},
	checkMinCount: function(){
		if(this.minCount<=this.callCount) Smoke.passed(this);
		else Smoke.failed(this, 'expected '+this.methodSignature()+' to be called at least '+this.minCount+" times but it only got called "+this.callCount+' times');
	},
	checkMaxCount: function(){
		if(this.maxCount>=this.callCount) Smoke.passed(this);//console.log('Mock passed!')
		else Smoke.failed(this, 'expected '+this.methodSignature()+' to be called at most '+this.maxCount+" times but it actually got called "+this.callCount+' times');
	},
	argumentMismatchError: function(args) {
	  Smoke.failed(this, 'expected ' + this._attr + ' with ' + Smoke.printArguments(this.callerArgs) + ' but received it with ' + Smoke.printArguments(args));
	},
	methodSignature: function(){
		return this._attr + Smoke.printArguments(this.callerArgs);
	},
	parseCount: function(c){
		switch(c){
			case 'once': 
				return 1;
			case 'twice':
				return 2;
			default:
				return c;
		}
	}
};
