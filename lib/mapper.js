
/**
 * Module dependencies.
 */

var crypto = require('crypto');
var extend = require('extend');
var is = require('is');
var isostring = require('isostring');
var reject = require('reject');
var qs = require('qs');
var time = require('unix-time');

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var traits = prefixKeys(stringifyNested(identify.traits()), 'cv_');

  // Woopra likes timestamps in milliseconds
  // Ref: https://www.woopra.com/docs/manual/configure-schema/
  Object.keys(traits).forEach(function(key){
    var val = traits[key];
    if (isostring(val) || is.date(val)) {
      traits[key] = time(val) * 1000;
    }
  });

  delete traits.cv_id;
  var payload = createBasePayload(identify, this.settings);
  payload.cv_company = identify.proxy('traits.company');
  payload.cv_name = identify.name();
  return extend(traits, payload);
};

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var props = prefixKeys(stringifyNested(track.properties()), 'ce_');
  props.cv_email = props.ce_email;
  delete props.ce_id;
  delete props.ce_email;
  var payload = createBasePayload(track, this.settings);
  payload.event = track.event();
  return extend(props, payload);
};

/**
 * Create a base payload.
 *
 * @param {Facade} message
 * @return {Object}
 * @api private
 */

function createBasePayload(message, settings){
  return reject.types({
    cv_id: message.userId(),
    timestamp: message.timestamp().getTime().toString(),
    timeout: timeout(message, settings),
    cookie: cookie(message),
    lang: language(message),
    host: settings.domain,
    ua: message.userAgent(),
    context: JSON.stringify(message.options()),
    ip: message.ip()
  }, ['null', 'undefined']);
}

/**
 * Create a cookie.
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

function cookie(message){
  var woopraSettings = message.options('Woopra');
  if (woopraSettings && woopraSettings.cookie) return woopraSettings.cookie;

  return crypto
    .createHash('md5')
    .update(message.userId() || message.sessionId())
    .digest('hex');
}

/**
 * Get timeout.
 *
 * @param {Facade} message
 * @param {Obejct} settings
 * @return {Number}
 * @api private
 */

function timeout(message, settings){
  // in milliseconds
  return message.proxy('options.timeout')
    || settings.timeout
    || "30000";
}

/**
 * Language.
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

function language(message){
  return message.proxy('traits.language')
    || message.proxy('options.language');
}

/**
 * Prefix keys of `obj` with `str`.
 *
 * @param {Object} obj
 * @param {String} str
 * @return {Object}
 * @api private
 */

function prefixKeys(obj, str){
  return Object.keys(obj).reduce(function(ret, key){
    ret[str + key] = obj[key];
    return ret;
  }, {});
}

/**
 * Stringify nested objects.
 *
 * Undocumented aspect of Woopra's API, but apparently required. Breaks
 * on `Completed Order` `properties.products`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stringifyNested(obj) {
  var qsSettings = {
    encode: false
  };

  return Object.keys(obj).reduce(function(ret, key){
    if (Array.isArray(obj[key]) || is.object(obj[key])) {
      ret[key] = qs.stringify(obj[key], qsSettings);
    }
    else if (obj[key] === null || obj[key] === undefined){
      ret[key] = '';
    }
    else
    {
      ret[key] = obj[key].toString(); //Should not have to call toString() here. Dangerous. Only for tests to pass.  see https://github.com/segmentio/integration-tester/issues/26
    }

    return ret;
  }, {});
}
