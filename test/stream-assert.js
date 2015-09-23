// for our tests this is better than require('stream-assert');
var through2 = require('through2');


module.exports = {
    test: test,
    done: done,
    length: length
};

function test(test_fct){
    return through2.obj(
        function(file, enc, cb){
            test_fct(file);
            this.push(file);
            cb();
        }
    );
}

function done(done){
    return through2.obj(
        function(file, enc, cb){
            this.push(file);
            cb();
        } ,
        function(cb){
            done();
            cb();
        }
    );
}

function length(length){
    var count = 0;
    return through2.obj(
        function(file, enc, cb){
            count++;
            this.push(file);
            cb();
        } ,
        function(cb){
            if( count !== length )
                throw new Error('Stream should pipe '+length+' element but is piping '+count+' element instead');
            cb();
        }
    );
}

