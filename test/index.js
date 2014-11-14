
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
      .channels(['server'])
      .retries(2);
  });

  describe('.validate()', function(){
    it('should be invalid if .domain is missing', function(){
      delete settings.domain;
      test.invalid({}, settings);
    });

    it('should be valid if settings are complete', function(){
      test.valid({}, settings);
    });
  });

  describe('.mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var track = {
        properties: { revenue: 100, prop: 'prop' },
        context: { ip: '127.0.0.1' },
        timestamp: new Date(),
        userId: 'userId',
        event: 'event'
      };

      test
        .set(settings)
        .track(track)
        .query({
          id: track.userId,
          timestamp: track.timestamp.getTime().toString(),
          cookie: md5('userId'),
          host: settings.domain,
          ce_name: 'event',
          ce_revenue: '100',
          ce_prop: 'prop',
          ip: '127.0.0.1',
          timeout: '30'
        })
        .expects(200, done);
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = {
        traits: { company: 'company', name: 'name' },
        context: { ip: '127.0.0.1' },
        timestamp: new Date(),
        userId: 'userId',
      };

      test
        .set(settings)
        .identify(identify)
        .query({
          id: identify.userId,
          timestamp: identify.timestamp.getTime().toString(),
          cookie: md5('userId'),
          host: settings.domain,
          cv_company: 'company',
          cv_name: 'name',
          ip: '127.0.0.1',
          timeout: '30'
        })
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
