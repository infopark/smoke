Screw.Unit(function() {
	describe("core", function() {    
    var anonymous_function = function() { return arguments };
    describe("printArguments", function() {
      it("should return '()' is the arguments are empty", function() {
        expect(Smoke.printArguments(arguments)).to(equal, '()');
      });

      it("should return '()' is the arguments are undefined", function() {
        expect(Smoke.printArguments()).to(equal, '()');
      });

      it("should return the arguments comma seperated wrapped in parenthesis", function() {
        var args = anonymous_function(1,2);
        expect(Smoke.printArguments(args)).to(equal, '(1, 2)');
      });
      
      it("should handle being passed something other than an array or arguments object", function() {
        expect(Smoke.printArguments(false)).to(equal, '(false)');
      });
    });
    
    describe("argumentsToArray", function() {
      it("should return an array", function() {
        expect(Smoke.argumentsToArray(anonymous_function(1,2)) instanceof Array).to(equal, true);
      });
      
      it("should return the arguments in an array", function() {
        expect(Smoke.argumentsToArray(anonymous_function(1,2))).to(equal, [1,2]);        
      });
      
      it("should return the array if passed an array", function() {
        var array = [];
        expect(Smoke.argumentsToArray(array) === array).to(equal, true)
      })
    });
	});
});