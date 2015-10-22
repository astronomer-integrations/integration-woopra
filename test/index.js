
var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var mapper = require('../lib/mapper');
var crypto = require('crypto');
var assert = require('assert');
var Woopra = require('..');

describe('Woopra', function(){
  var woopra;
  var settings;
  var test;

  beforeEach(function(){
    settings = { domain: 'ivolo.me' };
    woopra = new Woopra(settings);
    test = Test(woopra, __dirname);
  });

  it('should have the correct settings', function(){
    test
      .name('Woopra')
      .endpoint('http://www.woopra.com/track')
      .ensure('settings.domain')
      .channels(['server']);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = {
        type: 'identify',
        traits: {
          email: 'jd@example.com'
        }
      };
    });

    it('should be invalid if .domain is missing', function(){
      delete settings.domain;
      test.invalid(msg, settings);
    });

    it('should be valid if settings are complete', function(){
      test.valid(msg, settings);
    });
  });

  describe('.mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });

      it('should map identify nested', function () {
        test.maps('identify-nested');
      });

      it('should map identify with identify cookie', function(){
        test.maps('identify-cookie');
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });

      it('should map track nested', function(){
        test.maps('track-nested');
      });

      it('should map track-cookie', function(){
        test.maps('track-cookie');
      })
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var json = test.fixture('track-basic');

      test
        .set(settings)
        .track(json.input)
        .query(json.output)
        .expects(200, done);
    });

    it('should override cookie if provided', function(done){
      var json = test.fixture('track-cookie');

      test
        .set(settings)
        .track(json.input)
        .query(json.output)
        .expects(200, done);
    })
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var json = test.fixture('identify-basic');

      // we delete these prior to the request after the mapper
      delete json.output.ua;
      delete json.output.lang;

      test
        .set(settings)
        .identify(json.input)
        .query(json.output)
        .expects(200, done);
    });

    it('should override cookie if provided', function(done){
      var json = test.fixture('identify-cookie');

      delete json.output.ua;
      delete json.output.lang;

      test
        .set(settings)
        .identify(json.input)
        .query(json.output)
        .expects(200, done);
    });

    it('should strip cv_id if undefined/null', function(done){
      var json = test.fixture('identify-cookie');

      delete json.output.ua;
      delete json.output.lang;
      json.input.userId = null;
      delete json.output.cv_id;

      test
        .set(settings)
        .identify(json.input)
        .query(json.output)
        .expects(200, done);
    });
  });
});

/**
 * Hash the string for the userId
 *
 * @param {String} str
 * @return {String} [description]
 */

function md5(str){
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
}
