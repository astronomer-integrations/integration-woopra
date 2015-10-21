
/**
 * Module dependencies.
 */

var crypto = require('crypto');
var extend = require('extend');
var is = require('is');
var reject = require('reject');

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var traits = prefixKeys(identify.traits(), 'cv_');
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
  return reject({
    cv_id: message.userId(),
    timestamp: message.timestamp().getTime().toString(),
    timeout: timeout(message, settings),
    cookie: cookie(message),
    lang: language(message),
    host: settings.domain,
    ua: message.userAgent(),
    context: JSON.stringify(message.options()),
    ip: message.ip()
  });
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
    if (is.object(obj[key])) {
      ret[str + key] = obj[key]
    } else {
      ret[str + key] = obj[key].toString();
    }
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

function stringifyNested(obj){
  return Object.keys(obj).reduce(function(ret, key){
    if (Array.isArray(obj[key])) ret[key] = JSON.stringify(obj[key]);
    else ret[key] = obj[key];
    return ret;
  }, {});
}
